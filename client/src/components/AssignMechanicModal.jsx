import React, { useState } from "react";
import api from "../services/api";
import AlertBanner from "./AlertBanner";

const AssignMechanicModal = ({ booking, mechanics, onClose, onAssigned }) => {
  const [selectedMechanicId, setSelectedMechanicId] = useState(
    booking?.mechanic?._id || ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAssign = async () => {
    if (!selectedMechanicId) {
      setError("Please select a mechanic to assign.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const res = await api.patch(`/bookings/${booking._id}/assign`, {
        mechanicId: selectedMechanicId,
      });

      if (onAssigned) {
        onAssigned(res.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign mechanic.");
    } finally {
      setSubmitting(false);
    }
  };

  const bookingServiceName = (booking?.service?.name || "").toLowerCase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0 }}>Assign Mechanic to Booking</h2>
            <p className="text-muted" style={{ margin: "4px 0 0 0" }}>
              Service: <strong>{booking?.service?.name}</strong> | Vehicle:{" "}
              <strong>
                {booking?.vehicle?.brand} {booking?.vehicle?.model}
              </strong>
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <AlertBanner type="error" message={error} onClose={() => setError("")} />

          <p className="text-muted" style={{ fontSize: "0.9rem" }}>
            Select an active mechanic from your garage. Mechanics with matching skills and low workload are recommended below:
          </p>

          <div className="mechanic-selection-list">
            {mechanics.length === 0 ? (
              <div className="empty-state" style={{ padding: "20px" }}>
                <p>No active mechanics are currently in your garage.</p>
              </div>
            ) : (
              mechanics.map((m) => {
                const hasSkillMatch = (m.skills || []).some((s) =>
                  bookingServiceName.includes(s.toLowerCase()) ||
                  s.toLowerCase().includes(bookingServiceName.split(" ")[0])
                );

                return (
                  <label
                    key={m.id || m._id}
                    className={`mechanic-radio-card ${
                      selectedMechanicId === (m.id || m._id) ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="mechanicSelection"
                      value={m.id || m._id}
                      checked={selectedMechanicId === (m.id || m._id)}
                      onChange={(e) => setSelectedMechanicId(e.target.value)}
                    />
                    <div className="mechanic-radio-content">
                      <div className="m-radio-top">
                        <strong className="m-name">{m.name}</strong>
                        {m.isLead && <span className="badge badge-lead">⭐ Lead</span>}
                        {hasSkillMatch && (
                          <span className="badge badge-verified" style={{ marginLeft: "auto" }}>
                            🎯 Skill Match
                          </span>
                        )}
                      </div>

                      <div className="m-skills-tags" style={{ margin: "6px 0" }}>
                        {(m.skills || []).map((skill, sIdx) => (
                          <span key={sIdx} className="skill-chip-sm">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="m-workload-text">
                        <span>📞 {m.mobile}</span>
                        <span style={{ marginLeft: "15px" }}>
                          Active Workload: <strong>{m.activeJobsCount || 0} active jobs</strong>
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleAssign}
            disabled={submitting || !selectedMechanicId}
          >
            {submitting ? "Assigning..." : "Confirm Mechanic Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignMechanicModal;
