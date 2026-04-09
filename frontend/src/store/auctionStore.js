import { create } from 'zustand';

const useAuctionStore = create((set) => ({
  auctions: [],
  currentAuction: null,
  
  setAuctions: (auctions) => set({ auctions }),
  setCurrentAuction: (auction) => set({ currentAuction: auction }),
  updateBid: (auctionId, newBidValue, newBidder) => 
    set((state) => ({
      currentAuction: state.currentAuction?._id === auctionId 
        ? { ...state.currentAuction, currentBid: newBidValue, highestBidder: newBidder } 
        : state.currentAuction,
      auctions: state.auctions.map(a => a._id === auctionId 
        ? { ...a, currentBid: newBidValue, highestBidder: newBidder } 
        : a)
    }))
}));

export default useAuctionStore;
