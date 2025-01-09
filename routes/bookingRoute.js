const express = require("express");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid"); //https://www.npmjs.com/package/uuid
const stripe = require("stripe")("sk_test_tR3PYbcVNZZ796tH88S4VQ2u"); //


const router = express.Router();

const Booking = require("../models/booking");
const Room = require("../models/rooms");

router.post("/getallbookings", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.send(bookings);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error });
  }
});

router.post("/cancelbooking", async (req, res) => {
  const { bookingid, roomid } = req.body;
  try {
    const booking = await Booking.findOne({ _id: bookingid });

    booking.status = "cancelled";
    await booking.save();
    const room = await Room.findOne({ _id: roomid });
    const bookings = room.currentbookings;
    const temp = bookings.filter((x) => x.bookingid.toString() !== bookingid);
    room.currentbookings = temp;
    await room.save();

    res.send("Your booking cancelled successfully");
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error });
  }
});

router.post("/getbookingbyuserid", async (req, res) => {
  const { userid } = req.body;
  try {
    const bookings = await Booking.find({ userid: userid });

    res.send(bookings);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error });
  }
});

router.post("/bookroom", async (req, res) => {
    const { room, userid, fromdate, todate, totalAmount, totaldays, token } = req.body;
  
    try {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: token.email,
        source: token.id,
      });
  
      // Process payment
      const payment = await stripe.charges.create(
        {
          amount: totalAmount * 100,
          customer: customer.id,
          currency: "INR",
          receipt_email: token.email,
          description: `Room booking: ${room.name}`,
        },
        {
          idempotencyKey: uuidv4(),
        }
      );
  
      // Save booking if payment is successful
      const newBooking = new Booking({
        room: room.name,
        roomid: room._id,
        userid,
        fromdate: moment(fromdate).format("DD-MM-YYYY"),
        todate: moment(todate).format("DD-MM-YYYY"),
        totalamount: totalAmount,
        totaldays,
        transactionid: payment.id,
      });
      const booking = await newBooking.save();
  
      // Update room bookings
      const roomTmp = await Room.findOne({ _id: room._id });
      roomTmp.currentbookings.push({
        bookingid: booking._id,
        fromdate: moment(fromdate).format("DD-MM-YYYY"),
        todate: moment(todate).format("DD-MM-YYYY"),
        userid,
        status: booking.status,
      });
      await roomTmp.save();
  
      res.send("Payment Successful, Your Room is booked");
    } catch (error) {
      console.error("Booking Error:", error);
      res.status(400).json({ message: error.message || "Something went wrong" });
    }
  });
  

module.exports = router;