import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../services/api";
import AlertBanner from "../components/AlertBanner";

const CreateBooking = () => {
  const [searchParams] = useSearchParams();
  const preSelectedGarageId = searchParams.get("garageId") || "";
  const preSelectedServiceName = searchParams.get("serviceName") || "";

  const [vehicles, setVehicles] = useState([]);
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form inputs
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedGarage, setSelectedGarage] = useState(preSelectedGarageId);
  const [selectedService, setSelectedService] = useState(preSelectedServiceName);
  const [selectedMechanic, setSelectedMechanic] = useState("");
  const [appointmentAt, setAppointmentAt] = useState("");
  const [notes, setNotes] = useState("");

  const navigate = useNavigate();

  // Load customer vehicles and garages
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [vehiclesRes, garagesRes] = await Promise.all([
          api.get("/vehicles"),
          api.get("/api/garages"),
        ]);

        setVehicles(vehiclesRes.data);
        setGarages(garagesRes.data);

        // Pre-select first vehicle if available
        if (vehiclesRes.data.length > 0) {
          setSelectedVehicle(vehiclesRes.data[0]._id);
        }

        // Set default appointment time to tomorrow 10:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setAppointmentAt(localIso);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // When selected garage changes, reset or update service/mechanic options
  const currentGarage = garages.find((g) => g._id === selectedGarage);

  useEffect(() => {
    if (currentGarage) {
      const hasPreSelected = currentGarage.services?.some((s) => s.name === preSelectedServiceName);
      if (hasPreSelected) {
        setSelectedService(preSelectedServiceName);
      } else if (currentGarage.services?.length > 0) {
        setSelectedService(currentGarage.services[0].name);
      } else {
        setSelectedService("");
      }

      setSelectedMechanic("");
    }
  }, [selectedGarage, currentGarage, preSelectedServiceName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedVehicle) {
      setError("Please select one of your registered vehicles.");
      return;
    }

    if (!selectedGarage) {
      setError("Please select a service garage.");
      return;
    }

    if (!selectedService) {
      setError("Please select an available service.");
      return;
    }

    if (!appointmentAt) {
      setError("Please choose an appointment date and time.");
      return;
    }

    const appointmentDate = new Date(appointmentAt);
    if (appointmentDate <= new Date()) {
      setError("Appointment must be scheduled for a future time.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        vehicle: selectedVehicle,
        garage: selectedGarage,
        service: selectedService,
        appointmentAt: appointmentDate.toISOString(),
        mechanic: selectedMechanic || undefined,
        notes: notes.trim() || undefined,
      };

      await api.post("/bookings", payload);

      // Navigate to bookings list with success state
      navigate("/bookings", { state: { bookingCreated: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner spinner-primary"></span> Loading booking options...
      </div>
    );
  }

  // If customer has no vehicles yet, guide them to add one first
  if (vehicles.length === 0) {
    return (
      <div className="page-container">
        <div className="card empty-state">
          <div className="empty-icon">🚗</div>
          <h3>Vehicle Required to Book Service</h3>
          <p>You don't have any registered vehicles yet. Please register your vehicle first before booking an appointment.</p>
          <Link to="/vehicles" className="btn-primary">
            + Register a Vehicle Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Book a Vehicle Service</h1>
          <p className="page-subtitle">Schedule an appointment with a verified service center.</p>
        </div>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError("")} />

      <div className="card booking-form-card">
        <form onSubmit={handleSubmit} className="booking-form">
          {/* Step 1: Select Vehicle */}
          <div className="form-group">
            <label htmlFor="vehicle">Select Your Vehicle *</label>
            <select
              id="vehicle"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              required
            >
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.brand} {v.model} ({v.vehicleNumber}) - {v.fuelType}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Garage */}
          <div className="form-group">
            <label htmlFor="garage">Select Garage / Service Center *</label>
            <select
              id="garage"
              value={selectedGarage}
              onChange={(e) => setSelectedGarage(e.target.value)}
              required
            >
              <option value="">-- Choose a Garage --</option>
              {garages.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name} - {g.address}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Select Service from Garage */}
          {currentGarage && (
            <div className="form-group">
              <label htmlFor="service">Select Service Offering *</label>
              <select
                id="service"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                required
              >
                {currentGarage.services?.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name} - ₹{s.price} ({s.durationMinutes || 60} mins)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 4: Optional Mechanic Assignment */}
          {currentGarage?.mechanics && currentGarage.mechanics.length > 0 && (
            <div className="form-group">
              <label htmlFor="mechanic">Preferred Mechanic (Optional)</label>
              <select
                id="mechanic"
                value={selectedMechanic}
                onChange={(e) => setSelectedMechanic(e.target.value)}
              >
                <option value="">Auto-assign available mechanic</option>
                {currentGarage.mechanics.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.mobile || "Mechanic"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 5: Appointment Date & Time */}
          <div className="form-group">
            <label htmlFor="appointmentAt">Appointment Date &amp; Time *</label>
            <input
              id="appointmentAt"
              type="datetime-local"
              value={appointmentAt}
              onChange={(e) => setAppointmentAt(e.target.value)}
              required
            />
          </div>

          {/* Step 6: Customer Notes */}
          <div className="form-group">
            <label htmlFor="notes">Notes / Symptoms Description</label>
            <textarea
              id="notes"
              rows={3}
              placeholder="e.g. Brake pedal feels soft, AC cooling is low, general vehicle inspection required..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting && <span className="spinner"></span>}
              {submitting ? "Booking Appointment..." : "Confirm & Book Appointment"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBooking;
