import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Garages = () => {
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  const navigate = useNavigate();

  const fetchGarages = async (query = {}) => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (query.search) params.append("search", query.search);
      if (query.service) params.append("service", query.service);

      const res = await api.get(`/api/garages?${params.toString()}`);
      setGarages(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load garages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGarages();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGarages({ search, service: serviceFilter });
  };

  const handleResetSearch = () => {
    setSearch("");
    setServiceFilter("");
    fetchGarages();
  };

  const handleBookService = (garageId, serviceName = "") => {
    let url = `/create-booking?garageId=${garageId}`;
    if (serviceName) {
      url += `&serviceName=${encodeURIComponent(serviceName)}`;
    }
    navigate(url);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Find Garages &amp; Mechanics</h1>
          <p className="page-subtitle">
            Discover verified repair shops and specialized mechanics near you.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card search-card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-group">
            <label htmlFor="search">Search Garage Name or Address</label>
            <input
              id="search"
              type="text"
              placeholder="e.g. Apex, City Center, Ring Road..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="search-group">
            <label htmlFor="service">Filter by Service</label>
            <input
              id="service"
              type="text"
              placeholder="e.g. Oil Change, Brakes, AC, Alignment..."
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            />
          </div>

          <div className="search-buttons">
            <button type="submit" className="btn-primary">
              Search
            </button>
            {(search || serviceFilter) && (
              <button type="button" onClick={handleResetSearch} className="btn-secondary">
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Garages List */}
      {loading ? (
        <div className="loading-state">Finding available garages...</div>
      ) : garages.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No Garages Found</h3>
          <p>Try searching with a different keyword or resetting your filters.</p>
          <button onClick={handleResetSearch} className="btn-secondary">
            View All Garages
          </button>
        </div>
      ) : (
        <div className="garages-list">
          {garages.map((g) => (
            <div key={g._id} className="card garage-card">
              <div className="garage-card-main">
                <div className="garage-header">
                  <div className="garage-title-area">
                    <h3 className="garage-name">{g.name}</h3>
                    {g.verified && <span className="badge badge-verified">Verified</span>}
                  </div>
                  <div className="garage-rating">
                    ⭐ {g.rating ? g.rating.toFixed(1) : "New"}
                  </div>
                </div>

                <p className="garage-address">📍 {g.address}</p>
                {g.phone && <p className="garage-phone">📞 {g.phone}</p>}
                {g.description && <p className="garage-desc">{g.description}</p>}

                {/* Mechanics count badge */}
                {g.mechanics && g.mechanics.length > 0 && (
                  <div className="garage-meta">
                    <span className="meta-item">
                      👨‍🔧 {g.mechanics.length} Available Mechanic{g.mechanics.length > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Service Offerings */}
              <div className="garage-services-section">
                <h4>Available Services &amp; Rates</h4>
                {g.services && g.services.length > 0 ? (
                  <div className="services-grid">
                    {g.services.map((s) => (
                      <div key={s._id} className="service-item">
                        <div className="service-info">
                          <span className="service-name">{s.name}</span>
                          {s.description && (
                            <span className="service-desc">{s.description}</span>
                          )}
                          <span className="service-duration">
                            ⏱️ ~{s.durationMinutes || 60} mins
                          </span>
                        </div>
                        <div className="service-action">
                          <span className="service-price">₹{s.price}</span>
                          <button
                            onClick={() => handleBookService(g._id, s.name)}
                            className="btn-primary-sm"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">Standard vehicle repair and inspection available.</p>
                )}

                <div className="garage-book-footer">
                  <button
                    onClick={() => handleBookService(g._id)}
                    className="btn-outline"
                  >
                    Custom Booking at this Garage &rarr;
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Garages;
