# No signals currently needed for the Booking model.
# (Earlier this file had a post_save handler that tried to generate a
# QR code via booking.generate_qr() — that method and the qr_image field
# don't exist on the real model, since QR codes are generated client-side
# via qrserver.com instead. Removed to stop the AttributeError on booking
# creation.)