import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import AlertBanner from "./AlertBanner";

const TaskModal = ({ booking, mechanics = [], canCreateTask = false, onClose }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState(
    booking?.mechanic?._id || (mechanics.length > 0 ? (mechanics[0].id || mechanics[0]._id) : "")
  );
  const [creating, setCreating] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!booking?._id) return;
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/tasks/booking/${booking._id}`);
      setTasks(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [booking?._id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError("Task title is required.");
      return;
    }
    if (!newAssignedTo) {
      setError("Please select a mechanic to assign the task to.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      const res = await api.post(`/tasks/booking/${booking._id}`, {
        title: newTitle.trim(),
        description: newDesc.trim(),
        assignedTo: newAssignedTo,
      });

      setTasks((prev) => [...prev, res.data]);
      setNewTitle("");
      setNewDesc("");
      setSuccess("Task added and assigned successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task status.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0 }}>Service Tasks Breakdown</h2>
            <p className="text-muted" style={{ margin: "4px 0 0 0" }}>
              Booking: <strong>{booking?.service?.name}</strong> | Vehicle:{" "}
              <strong>
                {booking?.vehicle?.brand} {booking?.vehicle?.model} (
                {booking?.vehicle?.vehicleNumber})
              </strong>
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <AlertBanner type="success" message={success} onClose={() => setSuccess("")} />
          <AlertBanner type="error" message={error} onClose={() => setError("")} />

          {/* Form to create new task (Only Lead Mechanic or Garage Owner) */}
          {canCreateTask && (
            <form onSubmit={handleCreateTask} className="card task-create-form" style={{ marginBottom: "20px" }}>
              <h4>+ Create New Service Task</h4>
              <div className="form-group" style={{ marginBottom: "8px" }}>
                <input
                  type="text"
                  placeholder="Task title (e.g. Inspect brake pads &amp; measure thickness)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "8px" }}>
                <input
                  type="text"
                  placeholder="Description or notes (optional)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="form-control"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <select
                  value={newAssignedTo}
                  onChange={(e) => setNewAssignedTo(e.target.value)}
                  className="form-control"
                  style={{ flex: 1 }}
                  required
                >
                  <option value="">-- Assign Mechanic --</option>
                  {mechanics.map((m) => (
                    <option key={m.id || m._id} value={m.id || m._id}>
                      {m.name} {m.isLead ? "(Lead)" : ""}
                    </option>
                  ))}
                </select>

                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? "Adding..." : "Add Task"}
                </button>
              </div>
            </form>
          )}

          {/* List of Tasks */}
          {loading ? (
            <div className="loading-state">
              <span className="spinner spinner-primary"></span> Loading task breakdown...
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state" style={{ padding: "20px" }}>
              <p>No service tasks have been created for this booking yet.</p>
            </div>
          ) : (
            <div className="tasks-list">
              {tasks.map((task) => (
                <div key={task._id} className="card task-card" style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "1rem" }}>{task.title}</strong>
                      {task.description && (
                        <p className="text-muted" style={{ margin: "4px 0", fontSize: "0.85rem" }}>
                          {task.description}
                        </p>
                      )}
                      <small className="text-muted">
                        Assigned to: <strong>{task.assignedTo?.name || "Mechanic"}</strong> | Status:{" "}
                        <span className={`badge ${
                          task.status === "completed"
                            ? "badge-status-completed"
                            : task.status === "in_progress"
                            ? "badge-status-confirmed"
                            : "badge-status-pending"
                        }`}>
                          {task.status}
                        </span>
                      </small>
                    </div>

                    <div style={{ display: "flex", gap: "5px" }}>
                      {task.status !== "completed" && (
                        <button
                          type="button"
                          className="btn-success-sm"
                          onClick={() => handleUpdateStatus(task._id, "completed")}
                        >
                          ✓ Complete
                        </button>
                      )}
                      {task.status === "pending" && (
                        <button
                          type="button"
                          className="btn-primary-sm"
                          onClick={() => handleUpdateStatus(task._id, "in_progress")}
                        >
                          ▶ In Progress
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
