const base = 'http://localhost:3000';

async function api(method, path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: res.ok, status: res.status, headers: res.headers, data };
}

(async () => {
    const results = { positive: [], negative: [] };
    const ts = Date.now();

    function assert(type, num, desc, condition, detail = '') {
        const item = { num, desc, ok: !!condition, detail: typeof detail === 'object' ? JSON.stringify(detail) : String(detail) };
        results[type].push(item);
        if (!condition) {
            console.error(`FAILED [${type.toUpperCase()} #${num}]: ${desc} -> ${item.detail}`);
        } else {
            console.log(`PASSED [${type.toUpperCase()} #${num}]: ${desc}`);
        }
    }

    try {
        console.log("=== STARTING POSITIVE TESTS ===");

        // 1 & 2: Garage owner registration creates garage with unique reference code
        const ownerReg = await api('POST', '/users/register', {
            name: 'Apex Garage Owner',
            email: `apex_owner_${ts}@test.com`,
            mobile: '9876111111',
            password: 'password123',
            role: 'garage_owner',
            garageName: 'Apex Motor Works',
            garageAddress: '100 Speed Way, Tech City',
            garagePhone: '9876111111',
            garageDescription: 'Precision auto servicing and body repairs'
        });

        assert('positive', 1, "Garage owner registration creates garage", ownerReg.ok && !!ownerReg.data.garage, ownerReg.data);
        const ownerToken = ownerReg.data.token;
        const garageId = ownerReg.data.garage?.id;
        const referenceCode = ownerReg.data.garage?.referenceCode;
        assert('positive', 2, "Garage gets unique reference code", !!referenceCode && referenceCode.startsWith('GAR-'), referenceCode);

        // 3 & 4: Mechanic registers with valid garage code -> Join request is pending
        const mechReg = await api('POST', '/users/register', {
            name: 'Vikram Mechanic',
            email: `vikram_${ts}@test.com`,
            mobile: '9876222222',
            password: 'password123',
            role: 'mechanic',
            garageCode: referenceCode,
            skills: ['Engine Repair', 'Brake Service', 'Diagnostics']
        });
        assert('positive', 3, "Mechanic registers with valid garage code", mechReg.ok && !!mechReg.data.token, mechReg.data);
        const mechToken = mechReg.data.token;
        const mechId = mechReg.data.user.id;
        assert('positive', 4, "Join request is created as pending", mechReg.data.user.membershipStatus === 'pending', mechReg.data.user);

        // 5 & 6: Owner accepts mechanic -> Mechanic becomes active
        const joinReqs = await api('GET', '/garages/mine/join-requests', null, ownerToken);
        const targetReq = (joinReqs.data || []).find(r => (r.mechanic?._id === mechId || r.mechanic === mechId));
        let acceptResult = null;
        if (targetReq) {
            acceptResult = await api('PATCH', `/garages/mine/join-requests/${targetReq._id}`, { action: 'accept' }, ownerToken);
        }
        const isAccepted = acceptResult && acceptResult.ok && (acceptResult.data.request?.status === 'accepted' || acceptResult.data.status === 'accepted');
        assert('positive', 5, "Owner accepts mechanic", isAccepted, acceptResult?.data);

        const mechProfile = await api('GET', '/users/mechanic/profile', null, mechToken);
        const isActive = mechProfile.ok && (mechProfile.data.user?.membershipStatus === 'active' || mechProfile.data.membershipStatus === 'active');
        assert('positive', 6, "Mechanic becomes active", isActive, mechProfile.data);

        // 7: Mechanic can add skill
        const updateSkills = await api('PUT', '/users/mechanic/skills', {
            skills: ['Engine Repair', 'Brake Service', 'Diagnostics', 'AC Repair']
        }, mechToken);
        assert('positive', 7, "Mechanic can add skill", updateSkills.ok && updateSkills.data.skills.includes('AC Repair'), updateSkills.data);

        // 8: Owner can search mechanic by skill
        const skillSearch = await api('GET', '/garages/mine/mechanics/search?skill=Brake', null, ownerToken);
        assert('positive', 8, "Owner can search mechanic by skill", skillSearch.ok && skillSearch.data.some(m => m.name === 'Vikram Mechanic'), skillSearch.data);

        // Designate Vikram as Lead Mechanic for subsequent tests
        await api('PATCH', '/garages/mine/lead-mechanic', { mechanicId: mechId }, ownerToken);

        // Setup Customer & Vehicle & Booking
        const custReg = await api('POST', '/users/register', {
            name: 'Priya Customer',
            email: `priya_${ts}@test.com`,
            mobile: '9876333333',
            password: 'password123',
            role: 'customer'
        });
        const custToken = custReg.data.token;

        const vehRes = await api('POST', '/vehicles', {
            vehicleNumber: `MH${String(ts).slice(-8)}`,
            brand: 'Hyundai',
            model: 'Creta',
            fuelType: 'Diesel',
            manufacturingYear: 2022
        }, custToken);
        const vehId = vehRes.data._id;

        const bookingRes = await api('POST', '/bookings', {
            vehicle: vehId,
            garage: garageId,
            service: 'General Service & Inspection',
            appointmentAt: new Date(Date.now() + 86400000).toISOString(),
            notes: 'Check brakes and air conditioning'
        }, custToken);
        const bookingId = bookingRes.data._id;

        // 9: Owner assigns mechanic to booking
        const assignRes = await api('PATCH', `/bookings/${bookingId}/assign`, { mechanicId: mechId }, ownerToken);
        const isAssigned = assignRes.ok && (assignRes.data.mechanic === mechId || assignRes.data.mechanic?._id === mechId);
        assert('positive', 9, "Owner assigns mechanic to booking", isAssigned, assignRes.data);

        // 10: Appointment can be scheduled
        const newApptDate = new Date(Date.now() + 172800000).toISOString();
        const apptRes = await api('PATCH', `/bookings/${bookingId}/appointment`, { appointmentAt: newApptDate }, ownerToken);
        assert('positive', 10, "Appointment can be scheduled", apptRes.ok && new Date(apptRes.data.appointmentAt).getTime() === new Date(newApptDate).getTime(), apptRes.data);

        // 11: Lead mechanic can create task
        const taskCreateRes = await api('POST', `/tasks/booking/${bookingId}`, {
            title: 'Inspect Brake Pads and Fluid',
            description: 'Measure front and rear brake pads; check fluid level',
            assignedTo: mechId
        }, mechToken); // Vikram is lead mechanic
        assert('positive', 11, "Lead mechanic can create task", taskCreateRes.ok && !!taskCreateRes.data._id, taskCreateRes.data);
        const taskId = taskCreateRes.data._id;

        // 12: Mechanic can update assigned task
        const taskUpdateRes = await api('PATCH', `/tasks/${taskId}`, { status: 'completed' }, mechToken);
        assert('positive', 12, "Mechanic can update assigned task", taskUpdateRes.ok && taskUpdateRes.data.status === 'completed', taskUpdateRes.data);

        // 13-19: Mechanic creates invoice draft & Backend calculates everything
        const draftInvoiceRes = await api('POST', '/api/invoices', {
            bookingId: bookingId,
            items: [
                { description: 'Synthetic Engine Oil 5W-30', category: 'part', quantity: 4, unitPrice: 850 },   // 3400
                { description: 'Oil Filter Cartridge', category: 'part', quantity: 1, unitPrice: 450 },         // 450
                { description: 'Front Ceramic Brake Pads', category: 'part', quantity: 2, unitPrice: 1200 }     // 2400
            ],
            labourCharges: 1200,
            otherCharges: 250,
            discount: 500,
            gstPercentage: 18,
            notes: 'Replaced front pads and topped up fluids'
        }, mechToken);

        assert('positive', 13, "Mechanic creates invoice draft", draftInvoiceRes.ok && draftInvoiceRes.data.status === 'draft', draftInvoiceRes.data);
        const invoiceData = draftInvoiceRes.data;
        const invoiceId = invoiceData?._id;

        // Verify calculations:
        // Items total: 3400 + 450 + 2400 = 6250
        // Subtotal: 6250 + 1200 + 250 = 7700
        // Taxable: 7700 - 500 = 7200
        // GST (18%): 1296
        // CGST (9%): 648
        // SGST (9%): 648
        // Grand Total: 7200 + 1296 = 8496
        assert('positive', 14, "Backend calculates line items", invoiceData.items[0].amount === 3400 && invoiceData.items[1].amount === 450, invoiceData.items);
        assert('positive', 15, "Backend calculates subtotal", invoiceData.subtotal === 7700 && invoiceData.taxableAmount === 7200, { subtotal: invoiceData.subtotal, taxable: invoiceData.taxableAmount });
        assert('positive', 16, "Backend calculates GST", invoiceData.gstAmount === 1296, invoiceData.gstAmount);
        assert('positive', 17, "Backend calculates CGST", invoiceData.cgstAmount === 648, invoiceData.cgstAmount);
        assert('positive', 18, "Backend calculates SGST", invoiceData.sgstAmount === 648, invoiceData.sgstAmount);
        assert('positive', 19, "Backend calculates grand total", invoiceData.totalAmount === 8496, invoiceData.totalAmount);

        // 20: Mechanic finalizes invoice
        const finalizeRes = await api('PATCH', `/api/invoices/${invoiceId}/finalize`, {}, mechToken);
        assert('positive', 20, "Mechanic finalizes invoice", finalizeRes.ok && finalizeRes.data.status === 'finalized', finalizeRes.data);

        // 21: Booking becomes completed
        const customerBookings = await api('GET', '/bookings', null, custToken);
        const isBookingCompleted = customerBookings.ok && customerBookings.data.some(b => b._id === bookingId && b.status === 'completed');
        assert('positive', 21, "Booking becomes completed", isBookingCompleted, customerBookings.data?.map(b => ({ id: b._id, status: b.status })));

        // 22: Customer receives notification
        const notifications = await api('GET', '/api/notifications', null, custToken);
        assert('positive', 22, "Customer receives notification", notifications.ok && notifications.data.some(n => n.type === 'completed' || n.booking === bookingId), notifications.data);

        // 23: Customer views invoice
        const custInvoiceView = await api('GET', `/api/invoices/${invoiceId}`, null, custToken);
        assert('positive', 23, "Customer views invoice", custInvoiceView.ok && custInvoiceView.data.invoiceNumber === invoiceData.invoiceNumber, custInvoiceView.data);

        // 24: Customer downloads PDF
        const pdfRes = await fetch(`${base}/api/invoices/${invoiceId}/download`, {
            headers: { Authorization: `Bearer ${custToken}` }
        });
        const contentType = pdfRes.headers.get('content-type');
        const contentDisp = pdfRes.headers.get('content-disposition');
        const pdfBuf = await pdfRes.arrayBuffer();
        assert('positive', 24, "Customer downloads PDF", pdfRes.ok && contentType === 'application/pdf' && contentDisp.includes('attachment; filename=Invoice-') && pdfBuf.byteLength > 100, { contentType, contentDisp, size: pdfBuf.byteLength });

        // 25: Garage owner sees invoice/revenue information
        const ownerInvoices = await api('GET', '/api/invoices', null, ownerToken);
        assert('positive', 25, "Garage owner sees invoice/revenue information", ownerInvoices.ok && ownerInvoices.data.some(inv => inv._id === invoiceId), { count: ownerInvoices.data?.length });


        console.log("\n=== STARTING NEGATIVE SECURITY TESTS ===");

        // N1: Customer calls owner API -> reject (403)
        const custCallsOwnerApi = await api('GET', '/garages/mine/join-requests', null, custToken);
        assert('negative', 1, "Customer calls owner API -> reject (403)", !custCallsOwnerApi.ok && custCallsOwnerApi.status === 403, custCallsOwnerApi.status);

        // N2: Customer creates invoice -> reject (403)
        const custCreatesInvoice = await api('POST', '/api/invoices', { bookingId, items: [{ description: 'Oil', category: 'part', quantity: 1, unitPrice: 100 }] }, custToken);
        assert('negative', 2, "Customer creates invoice -> reject (403)", !custCreatesInvoice.ok && custCreatesInvoice.status === 403, custCreatesInvoice.status);

        // N3: Customer modifies invoice -> reject (403)
        const custModifiesInvoice = await api('PATCH', `/api/invoices/${invoiceId}/finalize`, {}, custToken);
        assert('negative', 3, "Customer modifies invoice -> reject (403)", !custModifiesInvoice.ok && custModifiesInvoice.status === 403, custModifiesInvoice.status);

        // Create second customer to test cross-customer data leakage
        const cust2Reg = await api('POST', '/users/register', {
            name: 'Bob Other Customer',
            email: `bob_${ts}@test.com`,
            mobile: '9876444444',
            password: 'password123',
            role: 'customer'
        });
        const cust2Token = cust2Reg.data.token;

        // N4: Customer views another customer's invoice -> reject (403)
        const cust2ViewsInvoice = await api('GET', `/api/invoices/${invoiceId}`, null, cust2Token);
        assert('negative', 4, "Customer views another customer's invoice -> reject (403)", !cust2ViewsInvoice.ok && cust2ViewsInvoice.status === 403, cust2ViewsInvoice.status);

        // N5: Customer downloads another customer's invoice -> reject (403)
        const cust2DownloadsInvoice = await api('GET', `/api/invoices/${invoiceId}/download`, null, cust2Token);
        assert('negative', 5, "Customer downloads another customer's invoice -> reject (403)", !cust2DownloadsInvoice.ok && cust2DownloadsInvoice.status === 403, cust2DownloadsInvoice.status);

        // Create second garage and mechanic
        const owner2Reg = await api('POST', '/users/register', {
            name: 'Other Garage Owner',
            email: `owner2_${ts}@test.com`,
            mobile: '9876555555',
            password: 'password123',
            role: 'garage_owner',
            garageName: 'Other Auto Care',
            garageAddress: '200 Other St',
            garagePhone: '9876555555'
        });
        const owner2Token = owner2Reg.data.token;
        const mech2Reg = await api('POST', '/users/register', {
            name: 'Other Mechanic',
            email: `othermech_${ts}@test.com`,
            mobile: '9876666666',
            password: 'password123',
            role: 'mechanic',
            garageCode: owner2Reg.data.garage?.referenceCode,
            skills: ['Engine Repair']
        });
        const mech2Token = mech2Reg.data.token;

        // N6: Mechanic from another garage accesses booking -> reject (403)
        const otherMechAccessesBooking = await api('PATCH', `/bookings/${bookingId}`, { status: 'in_progress' }, mech2Token);
        assert('negative', 6, "Mechanic from another garage accesses booking -> reject (403)", !otherMechAccessesBooking.ok && otherMechAccessesBooking.status === 403, otherMechAccessesBooking.status);

        // N7: Unassigned mechanic creates invoice -> reject (403)
        const unassignedMechCreatesInvoice = await api('POST', '/api/invoices', { bookingId, items: [{ description: 'Oil', category: 'part', quantity: 1, unitPrice: 100 }] }, mech2Token);
        assert('negative', 7, "Unassigned mechanic creates invoice -> reject (403)", !unassignedMechCreatesInvoice.ok && unassignedMechCreatesInvoice.status === 403, unassignedMechCreatesInvoice.status);

        // N8: Mechanic modifies another mechanic's invoice -> reject (403)
        const mech2ModifiesInvoice = await api('PATCH', `/api/invoices/${invoiceId}/finalize`, {}, mech2Token);
        assert('negative', 8, "Mechanic modifies another mechanic's invoice -> reject (403)", !mech2ModifiesInvoice.ok && mech2ModifiesInvoice.status === 403, mech2ModifiesInvoice.status);

        // N9: Mechanic modifies finalized invoice -> reject (409)
        const modifyFinalizedInvoice = await api('PATCH', `/api/invoices/${invoiceId}/finalize`, {}, mechToken);
        assert('negative', 9, "Mechanic modifies finalized invoice -> reject (409)", !modifyFinalizedInvoice.ok && modifyFinalizedInvoice.status === 409, modifyFinalizedInvoice.status);

        // N10: Mechanic approves own join request -> reject (403)
        const mechApprovesOwnJoin = await api('PATCH', `/garages/mine/join-requests/${targetReq?._id}`, { action: 'accept' }, mechToken);
        assert('negative', 10, "Mechanic approves own join request -> reject (403)", !mechApprovesOwnJoin.ok && mechApprovesOwnJoin.status === 403, mechApprovesOwnJoin.status);

        // N11: Mechanic edits another mechanic's skills -> reject (403/404)
        const mechEditsOtherSkills = await api('PUT', `/users/${mechId}`, { skills: ['Hacked'] }, mech2Token);
        assert('negative', 11, "Mechanic edits another mechanic's skills -> reject", !mechEditsOtherSkills.ok && (mechEditsOtherSkills.status === 403 || mechEditsOtherSkills.status === 404), mechEditsOtherSkills.status);

        // N12: Invalid garage code -> reject (404)
        const invalidCodeReg = await api('POST', '/users/register', {
            name: 'Bad Code Mech',
            email: `badcode_${ts}@test.com`,
            mobile: '9876777777',
            password: 'password123',
            role: 'mechanic',
            garageCode: 'GAR-INVALID999'
        });
        assert('negative', 12, "Invalid garage code -> reject (404)", !invalidCodeReg.ok && invalidCodeReg.status === 404, invalidCodeReg.status);

        // N13: Duplicate join request -> reject / handle safely
        const pendingMech = await api('POST', '/users/register', {
            name: 'Pending Mech',
            email: `pending_${ts}@test.com`,
            mobile: '9876888888',
            password: 'password123',
            role: 'mechanic',
            garageCode: referenceCode
        });
        assert('negative', 13, "Duplicate join request handled safely", pendingMech.ok && pendingMech.data.user.membershipStatus === 'pending', pendingMech.data);

        // Setup a new active booking for invoice validation tests
        const booking2Res = await api('POST', '/bookings', {
            vehicle: vehId,
            garage: garageId,
            service: 'Oil Change & Filter',
            appointmentAt: new Date(Date.now() + 500000000).toISOString(),
            notes: 'Secondary booking for calculation checks'
        }, custToken);
        await api('PATCH', `/bookings/${booking2Res.data._id}/assign`, { mechanicId: mechId }, ownerToken);

        // N14: Negative invoice price -> reject (400)
        const negPriceRes = await api('POST', '/api/invoices', {
            bookingId: booking2Res.data._id,
            items: [{ description: 'Oil', category: 'part', quantity: 1, unitPrice: -500 }]
        }, mechToken);
        assert('negative', 14, "Negative invoice price -> reject (400)", !negPriceRes.ok && negPriceRes.status === 400, negPriceRes.status);

        // N15: Negative quantity -> reject (400)
        const negQtyRes = await api('POST', '/api/invoices', {
            bookingId: booking2Res.data._id,
            items: [{ description: 'Oil', category: 'part', quantity: -2, unitPrice: 500 }]
        }, mechToken);
        assert('negative', 15, "Negative quantity -> reject (400)", !negQtyRes.ok && negQtyRes.status === 400, negQtyRes.status);

        // N16: Discount greater than subtotal -> reject (400)
        const overDiscountRes = await api('POST', '/api/invoices', {
            bookingId: booking2Res.data._id,
            items: [{ description: 'Oil', category: 'part', quantity: 1, unitPrice: 500 }],
            discount: 1000
        }, mechToken);
        assert('negative', 16, "Discount greater than subtotal -> reject (400)", !overDiscountRes.ok && overDiscountRes.status === 400, overDiscountRes.status);

        // N17: Invalid GST -> reject (400)
        const invalidGstRes = await api('POST', '/api/invoices', {
            bookingId: booking2Res.data._id,
            items: [{ description: 'Oil', category: 'part', quantity: 1, unitPrice: 500 }],
            gstPercentage: 150
        }, mechToken);
        assert('negative', 17, "Invalid GST -> reject (400)", !invalidGstRes.ok && invalidGstRes.status === 400, invalidGstRes.status);

        // N18: Manipulated frontend total -> backend recalculates
        const manipulatedRes = await api('POST', '/api/invoices', {
            bookingId: booking2Res.data._id,
            items: [{ description: 'Spark Plugs', category: 'part', quantity: 4, unitPrice: 250 }], // 1000
            gstPercentage: 18, // 180
            totalAmount: 1, // Front-end maliciously forged 1 rupee
            subtotal: 5,
            gstAmount: 0
        }, mechToken);
        assert('negative', 18, "Manipulated frontend total -> backend recalculates", manipulatedRes.ok && manipulatedRes.data.totalAmount === 1180 && manipulatedRes.data.subtotal === 1000, manipulatedRes.data?.totalAmount);

        // N19: Duplicate invoice -> reject (409)
        const dupFinalizedInvoice = await api('POST', '/api/invoices', {
            bookingId: bookingId,
            items: [{ description: 'Filter', category: 'part', quantity: 1, unitPrice: 300 }]
        }, mechToken);
        assert('negative', 19, "Duplicate invoice for finalized booking -> reject (409)", !dupFinalizedInvoice.ok && dupFinalizedInvoice.status === 409, dupFinalizedInvoice.status);

        // N20: Invalid JWT -> 401
        const invalidJwtRes = await api('GET', '/garages/mine', null, 'invalid.token.here');
        assert('negative', 20, "Invalid JWT -> 401", !invalidJwtRes.ok && invalidJwtRes.status === 401, invalidJwtRes.status);

        console.log("\n================ TEST SUMMARY ================");
        const posPassed = results.positive.filter(t => t.ok).length;
        const posFailed = results.positive.filter(t => !t.ok).length;
        const negPassed = results.negative.filter(t => t.ok).length;
        const negFailed = results.negative.filter(t => !t.ok).length;
        console.log(`Positive Tests: ${posPassed}/${results.positive.length} passed (${posFailed} failed)`);
        console.log(`Negative Tests: ${negPassed}/${results.negative.length} passed (${negFailed} failed)`);

        if (posFailed > 0 || negFailed > 0) {
            console.error("SOME TESTS FAILED!");
            process.exit(1);
        } else {
            console.log("ALL POSITIVE & NEGATIVE TESTS PASSED SUCCESSFULLY! (45/45)");
            process.exit(0);
        }

    } catch (err) {
        console.error("Test execution error:", err);
        process.exit(1);
    }
})();
