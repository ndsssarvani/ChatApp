import SupportTicket from '../models/SupportTicket.js';

const FAQS = [
  {
    id: 1,
    question: 'How do I start a one-on-one conversation?',
    answer: 'Navigate to Contacts or click on the search bar in the dashboard to find a user by name, username, or email. Click on their card to instantly open a direct chat.',
  },
  {
    id: 2,
    question: 'How do group chats work?',
    answer: 'Click the group icon (👥) on the dashboard header, choose a name for your group, and select at least 2 members. As the creator, you will automatically be designated an admin.',
  },
  {
    id: 3,
    question: 'What is Temporary Chat mode?',
    answer: 'Temporary chat enables disappearing messages. You can choose expiration intervals (e.g., 24 hours), after which expired messages are automatically cleaned up.',
  },
  {
    id: 4,
    question: 'How do I change my theme or language?',
    answer: 'Go to Settings and select Language & Accessibility or Dark Mode toggle. The application remembers your choices across sessions.',
  },
  {
    id: 5,
    question: 'How do I block or report someone?',
    answer: 'Go to Settings > Blocked / Report or view a user profile, and choose "Block User" or "Report User" to submit reasons to administrators.',
  },
];

// @desc    Get support FAQs
// @route   GET /api/support/faqs
export const getFaqs = (req, res) => {
  res.status(200).json({ success: true, faqs: FAQS });
};

// @desc    Submit support ticket
// @route   POST /api/support/tickets
export const createTicket = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const ticket = await SupportTicket.create({
      user: req.user ? req.user._id : null,
      name,
      email,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully. Our team will contact you shortly.',
      ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
