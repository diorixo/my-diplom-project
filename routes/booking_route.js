const router = require('express').Router();
const trainingController = require('../controllers/booking_controller')
const authFunctions = require('../services/session');

router.post('/traininng/book_training', authFunctions.authenticateToken, trainingController.bookTraining);
router.post('/user/cancel_booking', authFunctions.authenticateToken, trainingController.cancelBooking);
router.get('/user/bookings', authFunctions.authenticateToken, trainingController.getUserBookings);
router.get('/user/all_bookings', authFunctions.authenticateToken, trainingController.getUserAllBookings);
router.post('/trainer/manage_trainings/:id/attendance', authFunctions.authenticateToken, trainingController.updateBookingAttendance);

module.exports = router;