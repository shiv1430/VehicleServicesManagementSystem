const base = 'http://localhost:3000';
async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(method + ' ' + path + ' -> ' + res.status + ': ' + JSON.stringify(data));
  return data;
}
(async () => {
  try {
    const ts = Date.now();
    const customer = await api('POST', '/users/register', { name: 'Alice Customer 3', email: `alice3_${ts}@example.com`, mobile: '9876500201', password: 'password123', role: 'customer' });
    const owner = await api('POST', '/users/register', { name: 'Owner Three', email: `owner3_${ts}@example.com`, mobile: '9876500202', password: 'password123', role: 'garage_owner' });
    const mechanic = await api('POST', '/users/register', { name: 'Mia Mechanic 3', email: `mechanic3_${ts}@example.com`, mobile: '9876500203', password: 'password123', role: 'mechanic' });
    const garage = await api('POST', '/garages', { name: 'City Auto Care 3', address: 'Main Road', phone: '1112223333', description: 'Full service', services:[{ name:'Oil Change', description:'Engine oil change', price:1500, durationMinutes:60 }, { name:'Brake Repair', description:'Brake diagnostics', price:2600, durationMinutes:120 }], verified: true }, owner.token);
    await api('POST', `/garages/${garage._id}/mechanics`, { mechanicId: mechanic.user.id }, owner.token);
    const vehicle = await api('POST', '/vehicles', { vehicleNumber: `KA${String(ts).slice(-8)}`, brand: 'Honda', model: 'City', fuelType: 'Petrol', manufacturingYear: 2021 }, customer.token);
    const future = new Date(Date.now() + 2 * 86400000).toISOString();
    const booking = await api('POST', '/bookings', { vehicle: vehicle._id, garage: garage._id, service: 'Oil Change', appointmentAt: future, notes: 'Engine noise' }, customer.token);
    const mechanicView = await api('GET', '/bookings', null, mechanic.token);
    const accepted = await api('PATCH', `/bookings/${booking._id}`, { status: 'accepted' }, mechanic.token);
    const inProgress = await api('PATCH', `/bookings/${booking._id}`, { status: 'in_progress' }, mechanic.token);
    const completed = await api('PATCH', `/bookings/${booking._id}`, { status: 'completed' }, mechanic.token);
    const invoiceList = await api('GET', '/api/invoices', null, customer.token);
    const review = await api('POST', '/api/reviews', { booking: booking._id, rating: 5, comment: 'Very professional service' }, customer.token);
    const chat = await api('POST', `/api/chat/${booking._id}`, { text: 'Customer message for status update.' }, customer.token);
    const mechanicChat = await api('GET', `/api/chat/${booking._id}`, null, mechanic.token);
    const secondBooking = await api('POST', '/bookings', { vehicle: vehicle._id, garage: garage._id, service: 'Brake Repair', appointmentAt: new Date(Date.now() + 3 * 86400000).toISOString(), notes: 'Brake issue' }, customer.token);
    const rejected = await api('PATCH', `/bookings/${secondBooking._id}`, { status: 'rejected', rejectionReason: 'Mechanic unavailable.' }, mechanic.token);
    console.log(JSON.stringify({
      customer: customer.user,
      bookingStatus: booking.status,
      mechanicViewCount: mechanicView.length,
      acceptedStatus: accepted.status,
      inProgressStatus: inProgress.status,
      completedStatus: completed.status,
      invoiceCount: invoiceList.length,
      reviewId: review._id,
      chatId: chat._id,
      mechanicChatCount: mechanicChat.length,
      rejectedStatus: rejected.status,
      rejectionReason: rejected.rejectionReason
    }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
})();
