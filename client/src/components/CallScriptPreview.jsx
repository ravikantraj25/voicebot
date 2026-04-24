/**
 * Call Script Preview Component
 * Shows the full multi-level IVR call flow in the selected language
 * Demonstrates the interactive customer support capabilities
 */
import React, { useState } from 'react';
import { Eye, Volume2, Globe, X, MessageCircle, Headphones, Truck, CreditCard, Package, UserCircle } from 'lucide-react';

const MESSAGES = {
  english: {
    greeting: 'Hello! This is an automated call from Automaton AI Infosystem regarding your recent order.',
    prompt: 'Press 1 to confirm your order. Press 2 to reject your order. Press 3 for order support.',
    confirmed: 'Thank you! Your order has been confirmed. You will receive a confirmation message shortly. Have a great day!',
    rejected: 'Your order has been rejected. If you change your mind, you can place a new order anytime. Goodbye!',
    supportMenu: 'We are here to help! Press 1 for delivery issues. Press 2 for payment issues. Press 3 for product issues. Press 4 to speak to an agent.',
    deliveryIssue: 'Our team has been notified and will update the delivery status within 2 hours. You will receive an SMS with tracking details.',
    paymentIssue: 'Refunds are processed within 3 to 5 business days. Auto-refund within 24 hours if order was not placed.',
    productIssue: 'A replacement request has been initiated. Our team will contact you within 24 hours.',
    agentTransfer: 'Please hold while we connect you to a customer support agent.',
    langLabel: 'English',
    flag: '🇬🇧',
  },
  hindi: {
    greeting: 'नमस्ते! यह Automaton AI Infosystem की ओर से आपके हाल के ऑर्डर के बारे में एक स्वचालित कॉल है।',
    prompt: 'पुष्टि के लिए 1, अस्वीकार के लिए 2, सहायता के लिए 3 दबाएं।',
    confirmed: 'धन्यवाद! आपके ऑर्डर की पुष्टि हो गई है। आपका दिन शुभ हो!',
    rejected: 'आपका ऑर्डर अस्वीकार कर दिया गया है। अलविदा!',
    supportMenu: 'डिलीवरी-1, भुगतान-2, उत्पाद-3, एजेंट-4 दबाएं।',
    deliveryIssue: '2 घंटे में डिलीवरी स्थिति अपडेट होगी। SMS प्राप्त होगा।',
    paymentIssue: 'रिफंड 3-5 कार्य दिवसों में प्रोसेस होगा।',
    productIssue: 'रिप्लेसमेंट अनुरोध शुरू किया गया है। 24 घंटे में संपर्क होगा।',
    agentTransfer: 'एजेंट से जोड़ रहे हैं, कृपया प्रतीक्षा करें।',
    langLabel: 'Hindi',
    flag: '🇮🇳',
  },
  kannada: {
    greeting: 'ನಮಸ್ಕಾರ! ಇದು Automaton AI Infosystem ನಿಂದ ನಿಮ್ಮ ಆರ್ಡರ್ ಕುರಿತು ಕರೆ.',
    prompt: 'ಖಚಿತಪಡಿಸಲು 1, ತಿರಸ್ಕರಿಸಲು 2, ಸಹಾಯಕ್ಕೆ 3 ಒತ್ತಿ.',
    confirmed: 'ಧನ್ಯವಾದ! ನಿಮ್ಮ ಆರ್ಡರ್ ಖಚಿತಪಡಿಸಲಾಗಿದೆ. ಶುಭ ದಿನ!',
    rejected: 'ನಿಮ್ಮ ಆರ್ಡರ್ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ. ವಿದಾಯ!',
    supportMenu: 'ಡೆಲಿವರಿ-1, ಪಾವತಿ-2, ಉತ್ಪನ್ನ-3, ಏಜೆಂಟ್-4 ಒತ್ತಿ.',
    deliveryIssue: '2 ಗಂಟೆಗಳಲ್ಲಿ ಡೆಲಿವರಿ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತದೆ.',
    paymentIssue: '3-5 ದಿನಗಳಲ್ಲಿ ಮರುಪಾವತಿ ಪ್ರಕ್ರಿಯೆಗೊಳ್ಳುತ್ತದೆ.',
    productIssue: 'ಬದಲಿ ವಿನಂತಿ ಆರಂಭವಾಗಿದೆ. 24 ಗಂಟೆಯಲ್ಲಿ ಸಂಪರ್ಕಿಸುತ್ತೇವೆ.',
    agentTransfer: 'ಏಜೆಂಟ್‌ಗೆ ಸಂಪರ್ಕಿಸುತ್ತಿದ್ದೇವೆ, ನಿರೀಕ್ಷಿಸಿ.',
    langLabel: 'Kannada',
    flag: '🇮🇳',
  },
  marathi: {
    greeting: 'नमस्कार! हा Automaton AI Infosystem कडून तुमच्या ऑर्डरबद्दल कॉल आहे.',
    prompt: 'पुष्टीसाठी 1, नाकारण्यासाठी 2, सहाय्यासाठी 3 दाबा.',
    confirmed: 'धन्यवाद! ऑर्डरची पुष्टी झाली. शुभ दिन!',
    rejected: 'ऑर्डर नाकारला. बाय!',
    supportMenu: 'डिलिव्हरी-1, पेमेंट-2, उत्पाद-3, एजंट-4 दाबा.',
    deliveryIssue: '2 तासांत डिलिव्हरी स्थिती अपडेट होईल.',
    paymentIssue: '3-5 दिवसांत रिफंड प्रक्रिया होईल.',
    productIssue: 'बदली विनंती सुरू. 24 तासांत संपर्क होईल.',
    agentTransfer: 'एजंटशी जोडत आहोत, थांबा.',
    langLabel: 'Marathi',
    flag: '🇮🇳',
  },
};

const ScriptStep = ({ step, icon: Icon, text, color }) => (
  <div className="flex gap-3 items-start">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={16} />
    </div>
    <div>
      <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
        {step}
      </p>
      <p className="text-sm text-surface-200 leading-relaxed">{text}</p>
    </div>
  </div>
);

const CallScriptPreview = ({ language = 'english' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const msgs = MESSAGES[language] || MESSAGES.english;

  return (
    <>
      {/* Preview Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary flex items-center gap-2 w-full justify-center text-sm"
        type="button"
      >
        <Eye size={16} />
        Preview Call Script
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative glass-card p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 border border-brand-500/20 flex items-center justify-center">
                  <Volume2 size={20} className="text-brand-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-100">
                    Interactive Call Flow
                  </h3>
                  <p className="text-sm text-surface-400 flex items-center gap-1.5">
                    <Globe size={12} />
                    {msgs.flag} {msgs.langLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* ════════ LEVEL 1: Main Menu ════════ */}
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">
                Level 1 — Main Menu
              </div>
              <ScriptStep
                step="Step 1 — Greeting"
                icon={Volume2}
                text={msgs.greeting}
                color="bg-brand-500/15 text-brand-400"
              />
              <div className="border-l-2 border-dashed border-surface-700 ml-4 h-2" />
              <ScriptStep
                step="Step 2 — Prompt"
                icon={MessageCircle}
                text={msgs.prompt}
                color="bg-amber-500/15 text-amber-400"
              />
              <div className="border-l-2 border-dashed border-surface-700 ml-4 h-2" />

              {/* Main Menu Responses */}
              <div className="pl-11 space-y-2">
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
                  Customer Response
                </p>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md shrink-0">
                    Press 1
                  </span>
                  <p className="text-sm text-surface-300">{msgs.confirmed}</p>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/15">
                  <span className="text-xs font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-md shrink-0">
                    Press 2
                  </span>
                  <p className="text-sm text-surface-300">{msgs.rejected}</p>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-md shrink-0">
                    Press 3
                  </span>
                  <p className="text-sm text-surface-300">→ Opens Support Menu ↓</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="my-5 border-t border-surface-700/50" />

            {/* ════════ LEVEL 2: Support Menu ════════ */}
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">
                Level 2 — Support Menu
              </div>
              <ScriptStep
                step="Support Prompt"
                icon={Headphones}
                text={msgs.supportMenu}
                color="bg-cyan-500/15 text-cyan-400"
              />
              <div className="border-l-2 border-dashed border-surface-700 ml-4 h-2" />

              {/* Support Options */}
              <div className="pl-11 space-y-2">
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
                  Issue Resolution
                </p>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-800/40 border border-surface-700/50">
                  <span className="text-xs font-bold text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                    <Truck size={10} /> 1
                  </span>
                  <p className="text-xs text-surface-300">{msgs.deliveryIssue}</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-800/40 border border-surface-700/50">
                  <span className="text-xs font-bold text-fuchsia-400 bg-fuchsia-500/15 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                    <CreditCard size={10} /> 2
                  </span>
                  <p className="text-xs text-surface-300">{msgs.paymentIssue}</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-800/40 border border-surface-700/50">
                  <span className="text-xs font-bold text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                    <Package size={10} /> 3
                  </span>
                  <p className="text-xs text-surface-300">{msgs.productIssue}</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-800/40 border border-surface-700/50">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                    <UserCircle size={10} /> 4
                  </span>
                  <p className="text-xs text-surface-300">{msgs.agentTransfer}</p>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-6 pt-4 border-t border-surface-700/50">
              <p className="text-xs text-surface-500 text-center">
                💡 Multi-level interactive call — customer can navigate menus, get issue resolution, or return to main menu
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CallScriptPreview;
