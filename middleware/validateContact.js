export const validateContact = (req, res, next) => {
  const { name, email, whatsapp, subject, message } = req.body;
  const errors = {};

  // Validate Name
  if (!name || !name.trim()) {
    errors.name = "Full Name is required";
  } else if (name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters long";
  }

  // Validate Email
  if (!email || !email.trim()) {
    errors.email = "Email Address is required";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }
  }

  if (whatsapp && whatsapp.trim()) {
    const whatsappRegex = /^[+]?([0-9\s\-()]){7,25}$/;
    if (!whatsappRegex.test(whatsapp.trim())) {
      errors.whatsapp = "Please enter a valid WhatsApp number";
    }
  }

  // Validate Subject
  if (!subject || !subject.trim()) {
    errors.subject = "Subject is required";
  } else if (subject.trim().length < 5) {
    errors.subject = "Subject must be at least 5 characters long";
  }

  // Validate Message
  if (!message || !message.trim()) {
    errors.message = "Message is required";
  } else if (message.trim().length < 20) {
    errors.message = "Message must be at least 20 characters long";
  }

  // If there are errors, return them
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Input validation errors detected",
      errors,
    });
  }

  next();
};
