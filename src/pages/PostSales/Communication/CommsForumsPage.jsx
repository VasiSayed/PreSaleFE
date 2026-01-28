import React, { useMemo, useState, useEffect } from "react";
import SearchBar from "../../../common/SearchBar";
import { Heart, MessageCircle, Share2, MoreVertical, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import "../../PostSales/Financial/DemandNotes.css";
import "../../Booking/MyBookings.css";
import "./ForumsPage.css";

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

export default function CommsForumsPage() {
  const [tab, setTab] = useState("posts");
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  
  // Auto-expand comments on desktop by default
  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    if (isDesktop) {
      const defaultExpanded = {};
      postRows.forEach((post) => {
        if (post.comments && post.comments.length > 0) {
          defaultExpanded[post.id] = true;
        }
      });
      setExpandedComments(defaultExpanded);
    }
  }, []);

  // Sample data with media
  const categoryRows = [
    {
      id: 1,
      name: "Construction Updates",
      slug: "construction-updates",
      order: "1",
      created_at: "Jan 04, 2026 10:00",
    },
    {
      id: 2,
      name: "Community Events",
      slug: "community-events",
      order: "2",
      created_at: "Jan 08, 2026 15:30",
    },
  ];

  const postRows = [
    {
      id: 1,
      title: "Basement Painting Schedule",
      description: "We're excited to announce that basement painting will begin next week. All residents are requested to clear their basement areas by Monday. The painting will be completed in phases, starting with Tower A.",
      category: "Construction Updates",
      categorySlug: "construction-updates",
      created_at: "Jan 12, 2026 09:20",
      author: "Admin",
      authorAvatar: null,
      targets: "All Residents",
      likes: 24,
      comments: [
        { id: 1, author: "John Doe", text: "Great update! When will Tower B start?", time: "2h ago" },
        { id: 2, author: "Jane Smith", text: "Thanks for the heads up!", time: "1h ago" },
      ],
      media: [
        { id: 1, url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800", type: "IMAGE" },
        { id: 2, url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800", type: "IMAGE" },
        { id: 3, url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800", type: "IMAGE" },
      ],
    },
    {
      id: 2,
      title: "January Festive Meet-up",
      description: "Join us for our monthly community meet-up! We'll have food, games, and great conversations. All residents and their families are welcome.",
      category: "Community Events",
      categorySlug: "community-events",
      created_at: "Jan 16, 2026 18:10",
      author: "Event Coordinator",
      authorAvatar: null,
      targets: "Club Members",
      likes: 42,
      comments: [
        { id: 1, author: "Mike Johnson", text: "Can't wait! What time does it start?", time: "3h ago" },
        { id: 2, author: "Sarah Williams", text: "Will there be activities for kids?", time: "2h ago" },
        { id: 3, author: "Admin", text: "Starts at 6 PM, and yes, we have a kids corner!", time: "1h ago" },
      ],
      media: [
        { id: 1, url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800", type: "IMAGE" },
        { id: 2, url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800", type: "IMAGE" },
      ],
    },
    {
      id: 3,
      title: "New Gym Equipment Installed",
      description: "We've upgraded the gym with new equipment! Check out the new treadmills, weight machines, and yoga mats. The gym is now open 24/7 for all residents.",
      category: "Community Events",
      categorySlug: "community-events",
      created_at: "Jan 18, 2026 14:30",
      author: "Facilities Manager",
      authorAvatar: null,
      targets: "All Residents",
      likes: 67,
      comments: [
        { id: 1, author: "David Brown", text: "Amazing! Can't wait to try it out.", time: "5h ago" },
      ],
      media: [
        { id: 1, url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800", type: "IMAGE" },
        { id: 2, url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800", type: "IMAGE" },
        { id: 3, url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800", type: "IMAGE" },
        { id: 4, url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800", type: "IMAGE" },
      ],
    },
  ];

  const filteredPosts = useMemo(() => {
    let filtered = postRows;
    
    if (filterCategory) {
      filtered = filtered.filter((p) => p.category === filterCategory);
    }
    
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter((p) => 
        p.title.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [filterCategory, search]);

  const handleImageNavigation = (postId, direction) => {
    const post = postRows.find((p) => p.id === postId);
    if (!post || !post.media || post.media.length <= 1) return;
    
    const currentIndex = selectedImageIndex[postId] || 0;
    let newIndex;
    
    if (direction === "next") {
      newIndex = (currentIndex + 1) % post.media.length;
    } else {
      newIndex = currentIndex === 0 ? post.media.length - 1 : currentIndex - 1;
    }
    
    setSelectedImageIndex({ ...selectedImageIndex, [postId]: newIndex });
  };

  const toggleComments = (postId) => {
    setExpandedComments({
      ...expandedComments,
      [postId]: !expandedComments[postId],
    });
  };

  if (tab === "categories") {
    return (
      <div className="demand-notes-page">
        <div className="my-bookings-container payment-receipts-page">
          <div className="list-header">
            <div className="list-header-left">
              <SearchBar
                value={search}
                onChange={(v) => setSearch(v)}
                placeholder="Search categories..."
                wrapperClassName="search-box"
              />
            </div>
            <div className="list-header-right dn-header-actions">
              <button
                type="button"
                className="filter-btn demand-filter-btn"
                onClick={() => setOpenFilter(true)}
                title="Filters"
              >
                <i className="fa fa-filter" style={{ marginRight: 6 }} />
                Filters
              </button>
              <button
                type="button"
                className="filter-btn"
                onClick={() => setTab("posts")}
                title="View Posts"
              >
                View Posts
              </button>
            </div>
          </div>

          <div className="booking-table-wrapper pr-table-wrap">
            <div style={{ overflowX: "auto" }}>
              <table className="booking-table dn-subtable" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Order</th>
                    <th>Created On</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryRows.length === 0 ? (
                    <tr className="dn-row">
                      <td colSpan={4} className="booking-empty-row">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    categoryRows.map((row) => (
                      <tr key={row.id} className="dn-row">
                        <td>{toTitleCase(row.name)}</td>
                        <td className="dn-mono">{row.slug}</td>
                        <td>{row.order}</td>
                        <td>{row.created_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="demand-notes-page forums-page">
      <div className="forums-container">
        <div className="forums-header">
          <div className="forums-header-left">
            <h2 className="forums-title">Community Forums</h2>
            <p className="forums-subtitle">Stay connected with your community</p>
          </div>
          <div className="forums-header-right">
            <SearchBar
              value={search}
              onChange={(v) => setSearch(v)}
              placeholder="Search posts..."
              wrapperClassName="forums-search-box"
            />
            <button
              type="button"
              className="forums-filter-btn"
              onClick={() => setOpenFilter(true)}
              title="Filters"
            >
              <i className="fa fa-filter" style={{ marginRight: 6 }} />
              Filters
            </button>
            <button
              type="button"
              className="forums-tab-btn"
              onClick={() => setTab("categories")}
              title="View Categories"
            >
              Categories
            </button>
          </div>
        </div>

        <div className="forums-feed">
          {filteredPosts.length === 0 ? (
            <div className="forums-empty">
              <ImageIcon className="forums-empty-icon" />
              <p className="forums-empty-text">No posts found</p>
              <p className="forums-empty-subtext">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const currentImageIndex = selectedImageIndex[post.id] || 0;
              const hasMultipleImages = post.media && post.media.length > 1;
              const isDesktop = window.innerWidth >= 1024;
              const showComments = expandedComments[post.id] !== undefined 
                ? expandedComments[post.id] 
                : isDesktop; // Auto-expand on desktop

              return (
                <div key={post.id} className="forum-post-card">
                  <div className="forum-post-wrapper">
                    {/* Left Column - Media & Content */}
                    <div className="forum-post-left">
                      {/* Post Header */}
                      <div className="forum-post-header">
                        <div className="forum-post-author">
                          <div className="forum-avatar">
                            {post.authorAvatar ? (
                              <img src={post.authorAvatar} alt={post.author} />
                            ) : (
                              <span>{post.author.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="forum-author-info">
                            <div className="forum-author-name">{toTitleCase(post.author)}</div>
                            <div className="forum-post-meta">
                              <span className="forum-category-badge">{toTitleCase(post.category)}</span>
                              <span className="forum-time">{formatTimeAgo(post.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <button className="forum-more-btn" title="More options">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Post Media */}
                      {post.media && post.media.length > 0 && (
                        <div className="forum-post-media">
                          <div className="forum-media-container">
                            {post.media.map((mediaItem, idx) => (
                              <div
                                key={mediaItem.id}
                                className={`forum-media-slide ${idx === currentImageIndex ? "active" : ""}`}
                                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                              >
                                {mediaItem.type === "IMAGE" ? (
                                  <img
                                    src={mediaItem.url}
                                    alt={`${post.title} - Image ${idx + 1}`}
                                    className="forum-media-image"
                                    onError={(e) => {
                                      e.target.src = "https://via.placeholder.com/800x600?text=Image+Not+Found";
                                    }}
                                  />
                                ) : (
                                  <div className="forum-media-placeholder">
                                    <ImageIcon className="w-12 h-12" />
                                    <p>Media preview not available</p>
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {hasMultipleImages && (
                              <>
                                <button
                                  className="forum-media-nav forum-media-nav-prev"
                                  onClick={() => handleImageNavigation(post.id, "prev")}
                                  aria-label="Previous image"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                  className="forum-media-nav forum-media-nav-next"
                                  onClick={() => handleImageNavigation(post.id, "next")}
                                  aria-label="Next image"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                                
                                <div className="forum-media-indicators">
                                  {post.media.map((_, idx) => (
                                    <button
                                      key={idx}
                                      className={`forum-media-dot ${idx === currentImageIndex ? "active" : ""}`}
                                      onClick={() => setSelectedImageIndex({ ...selectedImageIndex, [post.id]: idx })}
                                      aria-label={`Go to image ${idx + 1}`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="forum-post-actions">
                        <div className="forum-actions-left">
                          <button className="forum-action-btn" title="Like">
                            <Heart className="w-6 h-6" />
                          </button>
                          <button
                            className="forum-action-btn forum-mobile-comment-toggle"
                            onClick={() => toggleComments(post.id)}
                            title="Comment"
                          >
                            <MessageCircle className="w-6 h-6" />
                          </button>
                          <button className="forum-action-btn" title="Share">
                            <Share2 className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      {/* Post Likes Count */}
                      {post.likes > 0 && (
                        <div className="forum-post-likes">
                          <strong>{post.likes}</strong> {post.likes === 1 ? "like" : "likes"}
                        </div>
                      )}

                      {/* Post Content */}
                      <div className="forum-post-content">
                        <div className="forum-post-title">{toTitleCase(post.title)}</div>
                        <div className="forum-post-description">
                          <span className="forum-author-name-inline">{toTitleCase(post.author)}</span>
                          {" "}
                          {post.description}
                        </div>
                        {post.targets && (
                          <div className="forum-post-targets">
                            <span className="forum-target-label">Target:</span> {toTitleCase(post.targets)}
                          </div>
                        )}
                      </div>

                      {/* Add Comment Input - Mobile */}
                      <div className="forum-add-comment forum-mobile-comment-input">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          className="forum-comment-input"
                        />
                      </div>
                    </div>

                    {/* Right Column - Comments (Desktop) */}
                    {post.comments && post.comments.length > 0 && (
                      <div className={`forum-post-right ${showComments ? "expanded" : ""}`}>
                        <div className="forum-comments-header">
                          <h3 className="forum-comments-title">
                            Comments ({post.comments.length})
                          </h3>
                          {!isDesktop && (
                            <button
                              className="forum-close-comments-btn"
                              onClick={() => toggleComments(post.id)}
                              aria-label="Close comments"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <div className="forum-comments-list">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="forum-comment">
                              <div className="forum-comment-header">
                                <div className="forum-comment-author">{toTitleCase(comment.author)}</div>
                                <div className="forum-comment-time">{comment.time}</div>
                              </div>
                              <div className="forum-comment-text">{comment.text}</div>
                            </div>
                          ))}
                        </div>
                        <div className="forum-add-comment">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            className="forum-comment-input"
                          />
                        </div>
                      </div>
                    )}

                    {/* Comments Section - Mobile (Collapsible) */}
                    {post.comments && post.comments.length > 0 && (
                      <div className={`forum-comments-section forum-mobile-comments ${showComments ? "expanded" : ""}`}>
                        {showComments ? (
                          <>
                            <button
                              className="forum-view-comments-btn"
                              onClick={() => toggleComments(post.id)}
                            >
                              Hide {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
                            </button>
                            <div className="forum-comments-list">
                              {post.comments.map((comment) => (
                                <div key={comment.id} className="forum-comment">
                                  <div className="forum-comment-author">{toTitleCase(comment.author)}</div>
                                  <div className="forum-comment-text">{comment.text}</div>
                                  <div className="forum-comment-time">{comment.time}</div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <button
                            className="forum-view-comments-btn"
                            onClick={() => toggleComments(post.id)}
                          >
                            View all {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
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
              <div className="dn-grid">
                <div className="dn-field">
                  <label>Category</label>
                  <select
                    className="dn-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categoryRows.map((c) => (
                      <option key={c.slug} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="dn-modal-footer">
              <button
                className="dn-btn dn-btn-light"
                onClick={() => {
                  setFilterCategory("");
                  setOpenFilter(false);
                }}
              >
                Clear
              </button>
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
