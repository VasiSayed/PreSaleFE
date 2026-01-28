import React, { useMemo, useState } from "react";
import SearchBar from "../../../common/SearchBar";
import { BarChart3, Users, Calendar, CheckCircle2, Circle } from "lucide-react";
import "../../PostSales/Financial/DemandNotes.css";
import "../../Booking/MyBookings.css";
import "./PollsPage.css";

const toTitleCase = (value) => {
  if (value === null || value === undefined) return value;
  const s = String(value).trim();
  if (!s) return s;
  return s
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
};

export default function CommsPollsPage() {
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState(false);

  // Sample poll data
  const pollRows = [
    {
      id: 1,
      question: "Should we add an EV charging station?",
      description: "We're considering installing EV charging stations in the parking area. Your opinion matters!",
      allow_multi_select: false,
      created_at: "Jan 10, 2026 14:00",
      total_votes: 124,
      options: [
        { id: 1, text: "Yes, definitely needed", votes: 89, percentage: 72 },
        { id: 2, text: "No, not necessary", votes: 25, percentage: 20 },
        { id: 3, text: "Maybe later", votes: 10, percentage: 8 },
      ],
      has_voted: true,
      user_vote: [1],
    },
    {
      id: 2,
      question: "Preferred clubhouse timings?",
      description: "Help us decide the best operating hours for the clubhouse",
      allow_multi_select: true,
      created_at: "Jan 21, 2026 09:30",
      total_votes: 98,
      options: [
        { id: 1, text: "6 AM - 10 PM", votes: 45, percentage: 46 },
        { id: 2, text: "7 AM - 11 PM", votes: 32, percentage: 33 },
        { id: 3, text: "8 AM - 12 AM", votes: 21, percentage: 21 },
      ],
      has_voted: false,
      user_vote: [],
    },
    {
      id: 3,
      question: "Which amenities should we prioritize?",
      description: "Select all that apply",
      allow_multi_select: true,
      created_at: "Jan 25, 2026 16:20",
      total_votes: 156,
      options: [
        { id: 1, text: "Swimming Pool", votes: 120, percentage: 77 },
        { id: 2, text: "Gym", votes: 98, percentage: 63 },
        { id: 3, text: "Playground", votes: 76, percentage: 49 },
        { id: 4, text: "Library", votes: 45, percentage: 29 },
      ],
      has_voted: true,
      user_vote: [1, 2],
    },
  ];

  const filteredPolls = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    if (!term) return pollRows;
    
    return pollRows.filter((poll) => 
      poll.question.toLowerCase().includes(term) ||
      poll.description?.toLowerCase().includes(term)
    );
  }, [search]);

  return (
    <div className="demand-notes-page polls-page">
      <div className="polls-container">
        <div className="polls-header">
          <div className="polls-header-left">
            <h2 className="polls-title">Community Polls</h2>
            <p className="polls-subtitle">Share your opinion and see what others think</p>
          </div>
          <div className="polls-header-right">
            <SearchBar
              value={search}
              onChange={(v) => setSearch(v)}
              placeholder="Search polls..."
              wrapperClassName="polls-search-box"
            />
            <button
              type="button"
              className="polls-filter-btn"
              onClick={() => setOpenFilter(true)}
              title="Filters"
            >
              <i className="fa fa-filter" style={{ marginRight: 6 }} />
              Filters
            </button>
            <button
              type="button"
              className="polls-add-btn"
              title="Add Poll"
            >
              <i className="fa fa-plus" style={{ marginRight: 6 }} />
              Add Poll
            </button>
          </div>
        </div>

        <div className="polls-feed">
          {filteredPolls.length === 0 ? (
            <div className="polls-empty">
              <BarChart3 className="polls-empty-icon" />
              <p className="polls-empty-text">No polls found</p>
              <p className="polls-empty-subtext">Try adjusting your search terms</p>
            </div>
          ) : (
            filteredPolls.map((poll) => (
              <div key={poll.id} className="poll-card">
                {/* Poll Header */}
                <div className="poll-header">
                  <div className="poll-header-left">
                    <BarChart3 className="poll-icon" />
                    <div className="poll-meta">
                      <div className="poll-question">{toTitleCase(poll.question)}</div>
                      <div className="poll-meta-info">
                        <span className="poll-badge">
                          {poll.allow_multi_select ? "Multiple Choice" : "Single Choice"}
                        </span>
                        <span className="poll-time">{formatTimeAgo(poll.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="poll-stats">
                    <Users className="poll-stat-icon" />
                    <span className="poll-stat-value">{poll.total_votes}</span>
                    <span className="poll-stat-label">votes</span>
                  </div>
                </div>

                {/* Poll Description */}
                {poll.description && (
                  <div className="poll-description">
                    {toTitleCase(poll.description)}
                  </div>
                )}

                {/* Poll Options */}
                <div className="poll-options">
                  {poll.options.map((option) => {
                    const isSelected = poll.has_voted && poll.user_vote.includes(option.id);
                    const isWinning = poll.has_voted && option.percentage === Math.max(...poll.options.map(o => o.percentage));
                    
                    return (
                      <div
                        key={option.id}
                        className={`poll-option ${isSelected ? "selected" : ""} ${isWinning ? "winning" : ""}`}
                      >
                        <div className="poll-option-header">
                          <div className="poll-option-left">
                            {poll.has_voted ? (
                              isSelected ? (
                                <CheckCircle2 className="poll-option-icon selected" />
                              ) : (
                                <Circle className="poll-option-icon" />
                              )
                            ) : (
                              <Circle className="poll-option-icon" />
                            )}
                            <span className="poll-option-text">{toTitleCase(option.text)}</span>
                          </div>
                          {poll.has_voted && (
                            <div className="poll-option-percentage">
                              {option.percentage}%
                            </div>
                          )}
                        </div>
                        {poll.has_voted && (
                          <div className="poll-option-bar-container">
                            <div
                              className={`poll-option-bar ${isWinning ? "winning-bar" : ""}`}
                              style={{ width: `${option.percentage}%` }}
                            />
                          </div>
                        )}
                        {poll.has_voted && (
                          <div className="poll-option-votes">
                            {option.votes} {option.votes === 1 ? "vote" : "votes"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Poll Footer */}
                <div className="poll-footer">
                  <div className="poll-footer-left">
                    <Calendar className="poll-footer-icon" />
                    <span className="poll-footer-text">
                      Created {new Date(poll.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {poll.has_voted && (
                    <div className="poll-voted-badge">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>You voted</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {openFilter && (
        <div
          className="dn-modal-overlay"
          onMouseDown={() => setOpenFilter(false)}
        >
          <div
            className="dn-modal dn-modal-wide"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="dn-modal-header">
              <div className="dn-modal-header-left dn-modal-header-left-center">
                <div className="dn-modal-title">Filters</div>
              </div>
              <button
                className="dn-close-btn"
                onClick={() => setOpenFilter(false)}
              >
                ×
              </button>
            </div>

            <div className="dn-modal-body">
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                No filters available.
              </div>
            </div>

            <div className="dn-modal-footer">
              <button
                className="dn-btn dn-btn-light"
                onClick={() => setOpenFilter(false)}
              >
                Cancel
              </button>
              <button
                className="dn-btn dn-btn-primary"
                onClick={() => setOpenFilter(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
