const base = 'http://localhost:3000';
const unique = Date.now();
const makeEmail = (prefix) => `${prefix}${unique}@qa.local`;

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

(async () => {
  const tests = [];
  const assert = (name, condition, detail = '') => tests.push({ name, ok: !!condition, detail });

  const customer = await api('POST', '/users/register', {
    name: 'QA Customer', email: makeEmail('customer'), mobile: '9000000001', password: 'password123', role: 'customer'
  });
  assert('customer registration', customer.ok && !!customer.data.token, JSON.stringify(customer.data));
  const customerToken = customer.data.token;

  const owner = await api('POST', '/users/register', {
    name: 'QA Owner', email: makeEmail('owner'), mobile: '9000000002', password: 'password123', role: 'garage_owner'
  });
  assert('garage owner registration', owner.ok && !!owner.data.token, JSON.stringify(owner.data));
  const ownerToken = owner.data.token;

  const mechanic = await api('POST', '/users/register', {
    name: 'QA Mechanic', email: makeEmail('mechanic'), mobile: '9000000003', password: 'password123', role: 'mechanic'
  });
  assert('mechanic registration', mechanic.ok && !!mechanic.data.token, JSON.stringify(mechanic.data));
  const mechanicToken = mechanic.data.token;
  const mechanicId = mechanic.data.user.id;

  const vehicle = await api('POST', '/vehicles', {
    vehicleNumber: `QA${unique}`.slice(0, 12), brand: 'Honda', model: 'City', fuelType: 'Petrol', manufacturingYear: 2021
  }, customerToken);
  assert('customer adds vehicle', vehicle.ok && !!vehicle.data._id, JSON.stringify(vehicle.data));
  const vehicleId = vehicle.data._id;

  const garage = await api('POST', '/garages', {
    name: 'QA Garage', address: 'QA Street', phone: '1111111111', description: 'Full service garage',
    services: [{ name: 'Oil Change', description: 'Engine oil change', price: 1500, durationMinutes: 60 }],
    verified: true
  }, ownerToken);
  assert('garage creation', garage.ok && !!garage.data._id, JSON.stringify(garage.data));
  const garageId = garage.data._id;

  const assignment = await api('POST', `/garages/${garageId}/mechanics`, { mechanicId }, ownerToken);
  assert('mechanic assignment', assignment.ok && Array.isArray(assignment.data.mechanics), JSON.stringify(assignment.data));

  const customerCannotAccessOwnerRoute = await api('GET', '/garages/mine', null, customerToken);
  assert('customer cannot access owner-only route', !customerCannotAccessOwnerRoute.ok && customerCannotAccessOwnerRoute.status === 403, JSON.stringify(customerCannotAccessOwnerRoute.data));

  const booking = await api('POST', '/bookings', {
    vehicle: vehicleId,
    garage: garageId,
    service: 'Oil Change',
    appointmentAt: new Date(Date.now() + 3600000).toISOString(),
    notes: 'Engine check'
  }, customerToken);
  assert('customer creates booking', booking.ok && !!booking.data._id, JSON.stringify(booking.data));
  const bookingId = booking.data._id;

  const customerCannotComplete = await api('PATCH', `/bookings/${bookingId}`, { status: 'completed' }, customerToken);
  assert('customer cannot complete booking directly', !customerCannotComplete.ok && customerCannotComplete.status === 403, JSON.stringify(customerCannotComplete.data));

  const mechanicList = await api('GET', '/bookings', null, mechanicToken);
  assert('mechanic sees booking list', mechanicList.ok && mechanicList.data.some((b) => b._id === bookingId), JSON.stringify({ count: mechanicList.data.length }));

  const accepted = await api('PATCH', `/bookings/${bookingId}`, { status: 'accepted' }, mechanicToken);
  assert('mechanic accepts booking', accepted.ok && accepted.data.status === 'accepted', JSON.stringify(accepted.data));

  const inProgress = await api('PATCH', `/bookings/${bookingId}`, { status: 'in_progress' }, mechanicToken);
  assert('mechanic marks in progress', inProgress.ok && inProgress.data.status === 'in_progress', JSON.stringify(inProgress.data));

  const completed = await api('PATCH', `/bookings/${bookingId}`, { status: 'completed' }, mechanicToken);
  assert('mechanic completes booking', completed.ok && completed.data.status === 'completed', JSON.stringify(completed.data));

  const invoice = await api('GET', '/api/invoices', null, customerToken);
  assert('invoice generated on completion', invoice.ok && Array.isArray(invoice.data) && invoice.data.length >= 1, JSON.stringify({ count: invoice.data.length }));

  const review = await api('POST', '/api/reviews', { booking: bookingId, rating: 5, comment: 'Excellent service' }, customerToken);
  assert('review created after completion', review.ok && !!review.data._id, JSON.stringify(review.data));

  const duplicateReview = await api('POST', '/api/reviews', { booking: bookingId, rating: 4, comment: 'Again' }, customerToken);
  assert('duplicate review blocked', !duplicateReview.ok && duplicateReview.status === 400, JSON.stringify(duplicateReview.data));

  const message = await api('POST', `/api/chat/${bookingId}`, { text: 'Customer message to mechanic' }, customerToken);
  assert('message sent', message.ok && !!message.data._id, JSON.stringify(message.data));

  const readMessages = await api('GET', `/api/chat/${bookingId}`, null, mechanicToken);
  assert('mechanic reads booking chat', readMessages.ok && Array.isArray(readMessages.data) && readMessages.data.length >= 1, JSON.stringify({ count: readMessages.data.length }));

  const unrelatedOwner = await api('POST', '/users/register', {
    name: 'Unrelated Owner', email: makeEmail('unrelated'), mobile: '9000000009', password: 'password123', role: 'garage_owner'
  });
  const ownerChatAccess = await api('GET', `/api/chat/${bookingId}`, null, unrelatedOwner.data.token);
  assert('owner cannot access unrelated chat', !ownerChatAccess.ok && ownerChatAccess.status === 403, JSON.stringify(ownerChatAccess.data));

  const rejectBooking = await api('POST', '/bookings', {
    vehicle: vehicleId,
    garage: garageId,
    service: 'Oil Change',
    appointmentAt: new Date(Date.now() + 7200000).toISOString(),
    notes: 'Rejection test'
  }, customerToken);
  const rejectBookingId = rejectBooking.data._id;
  const rejected = await api('PATCH', `/bookings/${rejectBookingId}`, { status: 'rejected', rejectionReason: 'Mechanic unavailable' }, mechanicToken);
  assert('mechanic rejects booking with reason', rejected.ok && rejected.data.status === 'rejected', JSON.stringify(rejected.data));

  const passCount = tests.filter(t => t.ok).length;
  const failCount = tests.filter(t => !t.ok).length;
  console.log(JSON.stringify({ total: tests.length, passed: passCount, failed: failCount, tests }, null, 2));
  process.exit(failCount > 0 ? 1 : 0);
})();
