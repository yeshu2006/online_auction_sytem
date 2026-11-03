import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Trash2, Users } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { API_BASE_URL } from '../config';

const AdminPanel = () => {
  const { user, token } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyAuction, setBusyAuction] = useState(null);
  const [message, setMessage] = useState('');

  const fetchAdminData = useCallback(async () => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const [usersResponse, auctionsResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/admin/users`, config),
      axios.get(`${API_BASE_URL}/api/auctions?limit=100`)
    ]);
    setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
    setAuctions(Array.isArray(auctionsResponse.data) ? auctionsResponse.data : []);
  }, [token]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await fetchAdminData();
      } catch {
        if (active) setError('Administrator data could not be loaded. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [fetchAdminData]);

  const handleDeleteAuction = async auction => {
    if (!window.confirm(`Remove "${auction.title}" from the auction room? Bid records will remain in collectors' histories.`)) return;
    setBusyAuction(auction._id);
    setError('');
    setMessage('');
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/auction/${auction._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuctions(current => current.filter(item => item._id !== auction._id));
      setMessage(`“${auction.title}” was removed from the auction room.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to remove this auction.');
    } finally {
      setBusyAuction(null);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="page-wrap"><div className="error-banner" role="alert">Administrator access is required.</div></div>;
  }

  return (
    <div className="page-wrap admin-page">
      <div className="eyebrow">Salon operations</div>
      <h1 className="page-title">Auction control.</h1>
      <p className="body-copy" style={{ margin: '10px 0 25px' }}>Review the room, registered accounts, and active lots.</p>
      {error && <div className="error-banner" role="alert">{error}</div>}
      {message && <div className="notice" role="status" style={{ marginBottom: 18 }}>{message}</div>}

      <div className="stat-grid" style={{ maxWidth: 520 }}>
        <div className="stat-card"><span>Registered users · latest 100</span><strong>{loading ? '…' : users.length}</strong></div>
        <div className="stat-card"><span>Auctions · latest 100</span><strong>{loading ? '…' : auctions.length}</strong></div>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-heading">
          <div><div className="eyebrow">Accounts</div><h2 style={{ marginTop: 5 }}>Registered users</h2></div>
          <Users size={19} color="var(--gold)" />
        </div>
        {loading ? <div className="loading-state">Opening account register…</div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Collector</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
              <tbody>
                {users.map(account => (
                  <tr key={account._id}>
                    <td>{account.name}</td>
                    <td>{account.email}</td>
                    <td><span className="admin-role">{account.role}</span></td>
                    <td>{new Date(account.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!users.length && <tr><td colSpan="4">No accounts to display.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-heading">
          <div><div className="eyebrow">Moderation</div><h2 style={{ marginTop: 5 }}>Auction lots</h2></div>
          <AlertTriangle size={18} color="var(--gold)" />
        </div>
        {loading ? <div className="loading-state">Opening the auction register…</div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Lot</th><th>Seller</th><th>Current bid</th><th>Closes</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {auctions.map(auction => (
                  <tr key={auction._id}>
                    <td>{auction.title}</td>
                    <td>{auction.seller?.name || 'Unknown'}</td>
                    <td>${Number(auction.currentBid || 0).toLocaleString()}</td>
                    <td>{new Date(auction.endTime).toLocaleDateString()}</td>
                    <td><span className="admin-role">{auction.status}</span></td>
                    <td>
                      <button className="admin-danger" type="button" disabled={busyAuction === auction._id}
                        onClick={() => handleDeleteAuction(auction)}>
                        <Trash2 size={12} /> {busyAuction === auction._id ? 'Removing…' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!auctions.length && <tr><td colSpan="6">No auctions to display.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPanel;
