import { Link, useLocation } from 'react-router-dom';

const pageContent = {
  '/help': {
    title: 'Help and auction rules',
    intro: 'A few clear rules make the auction room fair for everyone.',
    sections: [
      ['Before bidding', 'Create an account to bid. You cannot bid on an auction you listed. Review the lot description, seller details, and closing time before placing a bid.'],
      ['Placing a bid', 'Your bid must be higher than the current amount. A bid is recorded in the auction history and cannot be withdrawn.'],
      ['After an auction', 'The highest accepted bid is shown on the closed listing. BidAura currently provides auction tracking only; it does not process payments, shipping, or returns.']
    ]
  },
  '/privacy': {
    title: 'Privacy',
    intro: 'BidAura stores the account and auction information needed to run the marketplace.',
    sections: [
      ['Account information', 'Your name, email address, and password hash are stored by the service. Passwords are never stored as plain text.'],
      ['Auction activity', 'Listings, bids, and watchlist entries are associated with your account so you can review your activity.'],
      ['Your choices', 'Contact the site administrator to ask about access, correction, or removal of your account data.']
    ]
  },
  '/terms': {
    title: 'Terms',
    intro: 'By using BidAura, you agree to participate respectfully and provide accurate listing information.',
    sections: [
      ['Demo marketplace', 'This application is a demonstration. It does not process payments, deposits, escrow, refunds, or seller payouts.'],
      ['Bidding', 'Bids are recorded for demonstration and cannot be withdrawn. Do not treat demo auction results as a financial commitment.'],
      ['Listings', 'Only list items you are entitled to sell. Administrators may remove listings that do not follow these rules.']
    ]
  }
};

const InfoPage = () => {
  const { pathname } = useLocation();
  const page = pageContent[pathname] || pageContent['/help'];

  return (
    <div className="page-wrap ba-info-page">
      <Link className="ba-info-back" to="/">Back to auctions</Link>
      <h1 className="page-title">{page.title}</h1>
      <p className="body-copy">{page.intro}</p>
      {page.sections.map(([heading, content]) => (
        <section className="ba-info-section" key={heading}>
          <h2>{heading}</h2>
          <p>{content}</p>
        </section>
      ))}
    </div>
  );
};

export default InfoPage;
