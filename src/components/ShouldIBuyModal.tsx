import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Info,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';
import { Listing, ShouldIBuyAnalysis } from '../types';
import { fetchAiShouldIBuy } from '../lib/aiService';

interface ShouldIBuyModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onMakeOffer?: (suggestedOfferPrice?: number) => void;
}

export const ShouldIBuyModal: React.FC<ShouldIBuyModalProps> = ({
  listing,
  isOpen,
  onClose,
  onMakeOffer,
}) => {
  const [analysis, setAnalysis] = useState<ShouldIBuyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setAnalysis(null);
      setError(null);
      return;
    }

    let isMounted = true;
    async function runAnalysis() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAiShouldIBuy({
          title: listing.title,
          price: listing.price,
          originalPrice: listing.originalPrice,
          condition: listing.condition,
          sellerRating: listing.sellerRating,
          completedSales: listing.sellerSalesCount,
          isNegotiable: listing.negotiable ?? listing.isNegotiable,
          description: listing.description,
          category: listing.category,
        });
        if (isMounted) {
          setAnalysis(result);
        }
      } catch (err) {
        console.warn('Should I Buy evaluation fallback:', err);
        if (isMounted) {
          const discount =
            listing.originalPrice && listing.originalPrice > listing.price
              ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
              : 0;
          const isGood = discount >= 35 || (listing.sellerRating && listing.sellerRating >= 4.5);
          const rating = isGood ? 'Good Deal' : 'Consider Negotiating';
          const suggested = Math.round(listing.price * 0.85);

          setAnalysis({
            rating,
            badgeColor: isGood ? 'emerald' : 'amber',
            headline: isGood ? 'Competitive Campus Resale Price' : 'Reasonable price with room to bargain',
            explanation: `₹${listing.price.toLocaleString('en-IN')} is a fair price for ${listing.condition.toLowerCase()} condition. Inspect item before paying.`,
            suggestedOfferPrice: suggested,
            marketFairPriceRange: `₹${suggested.toLocaleString('en-IN')} - ₹${listing.price.toLocaleString('en-IN')}`,
            pros: [
              `${listing.condition} condition`,
              listing.sellerRating ? `${listing.sellerRating.toFixed(1)}★ student rating` : 'Campus student verified',
            ],
            cautions: ['Test item in person before making payment during campus meetup'],
            disclaimer: 'UniHut AI estimate based on available listing data — not guaranteed financial advice.',
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    runAnalysis();

    return () => {
      isMounted = false;
    };
  }, [isOpen, listing]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-100 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-stone-900 leading-tight">
                  Should I Buy This?
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase tracking-wider">
                  AI Evaluator
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Objective campus resale valuation powered by Gemini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item context banner */}
        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center gap-3">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-12 h-12 rounded-xl object-cover bg-stone-200 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-stone-900 truncate">{listing.title}</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-black text-stone-900">
                ₹{listing.price.toLocaleString('en-IN')}
              </span>
              {listing.originalPrice && listing.originalPrice > listing.price && (
                <span className="text-[11px] text-stone-400 line-through">
                  MRP ₹{listing.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-[10px] text-stone-500 font-medium">
                • {listing.condition}
              </span>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-stone-800">
              Analyzing campus resale price, depreciation & fair value...
            </p>
            <p className="text-[11px] text-stone-500">
              Comparing asking price against student market patterns
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {analysis && !loading && (
          <div className="space-y-4 animate-in fade-in">
            {/* Verdict Card */}
            <div
              className={`p-5 rounded-3xl border space-y-2.5 ${
                analysis.badgeColor === 'emerald'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : analysis.badgeColor === 'amber'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-stone-600">
                  Campus Verdict
                </span>
                <span
                  className={`text-xs font-black uppercase px-3 py-1 rounded-full shadow-xs ${
                    analysis.badgeColor === 'emerald'
                      ? 'bg-emerald-600 text-white'
                      : analysis.badgeColor === 'amber'
                      ? 'bg-amber-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {analysis.rating}
                </span>
              </div>
              <h4 className="text-base font-black leading-tight">{analysis.headline}</h4>
              <p className="text-xs leading-relaxed opacity-90">{analysis.explanation}</p>
            </div>

            {/* Fair price range and suggested offer */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                  Fair Resale Range
                </span>
                <span className="text-sm font-black text-stone-900 block">
                  {analysis.marketFairPriceRange}
                </span>
              </div>
              {analysis.suggestedOfferPrice && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    Bargain Target
                  </span>
                  <span className="text-sm font-black text-amber-900 block">
                    ₹{analysis.suggestedOfferPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* Pros and cautions */}
            <div className="space-y-2 text-xs">
              {analysis.pros && analysis.pros.length > 0 && (
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Key Advantages
                  </span>
                  <ul className="list-disc list-inside text-stone-600 space-y-0.5 text-[11px] pl-1">
                    {analysis.pros.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.cautions && analysis.cautions.length > 0 && (
                <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Buyer Precautions
                  </span>
                  <ul className="list-disc list-inside text-amber-800 space-y-0.5 text-[11px] pl-1">
                    {analysis.cautions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-stone-400 italic text-center">
              {analysis.disclaimer}
            </p>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              {onMakeOffer && (
                <button
                  type="button"
                  onClick={() => onMakeOffer(analysis.suggestedOfferPrice)}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-95 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>
                    Offer ₹{analysis.suggestedOfferPrice || Math.round(listing.price * 0.85)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
