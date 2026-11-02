import React, { useState } from 'react';
import {
  X,
  Database,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Terminal,
  CheckCircle,
} from 'lucide-react';

interface FirebaseGuideModalProps {
  onClose: () => void;
}

export const FirebaseGuideModal: React.FC<FirebaseGuideModalProps> = ({ onClose }) => {
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const FIRESTORE_RULES_TEXT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // MY DEEN & LIFE: Strict private user data rules
    // Only the authenticated owner can read, create, update, or delete their document and any nested subcollections
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

  const ENV_SAMPLE = `VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-app"
VITE_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"`;

  const copyText = (text: string, type: 'rules' | 'env') => {
    navigator.clipboard.writeText(text);
    if (type === 'rules') {
      setCopiedRules(true);
      setTimeout(() => setCopiedRules(false), 2000);
    } else {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="clay-card bg-white max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Database className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-stone-900 text-base font-bengali">
              ফায়ারবেস কনফিগারেশন ও ডিপ্লয়মেন্ট নির্দেশিকা
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-stone-700">
          {/* Step 1 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5 font-bengali">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] flex items-center justify-center">১</span>
              <span>ফায়ারবেস প্রজেক্ট তৈরি ও ওয়েব অ্যাপ যোগ</span>
            </h4>
            <p className="leading-relaxed font-bengali">
              ১. <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">Firebase Console</a>-এ যান এবং নতুন প্রজেক্ট তৈরি করুন।
              <br />
              ২. <strong>Authentication</strong> &gt; <strong>Sign-in method</strong> থেকে <em>Email/Password</em> এবং <em>Anonymous</em> চালু করুন।
              <br />
              ৩. <strong>Firestore Database</strong> তৈরি করুন (এশিয়া রিজিয়ন নির্বাচন করতে পারেন, যেমন: <code>asia-south1</code> বা <code>asia-east1</code>)।
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5 font-bengali">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] flex items-center justify-center">২</span>
                <span>Firestore Security Rules (firestore.rules)</span>
              </h4>
              <button
                onClick={() => copyText(FIRESTORE_RULES_TEXT, 'rules')}
                className="px-2.5 py-1 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 flex items-center gap-1 text-[11px]"
              >
                {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRules ? 'কপি হয়েছে' : 'রুলস কপি'}</span>
              </button>
            </div>
            <pre className="p-3 bg-stone-900 text-emerald-400 rounded-xl overflow-x-auto text-[11px] font-mono">
              {FIRESTORE_RULES_TEXT}
            </pre>
            <p className="text-[11px] text-stone-500 font-bengali">
              এই রুলস নিশ্চিত করে যে শুধুমাত্র লগইনকৃত ব্যবহারকারী তার নিজস্ব <code>users/{'{uid}'}/**</code> পাথ ছাড়া অন্য কারো তথ্য অ্যাক্সেস বা পরিবর্তন করতে পারবে না।
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5 font-bengali">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] flex items-center justify-center">৩</span>
                <span>এনভায়রনমেন্ট ভেরিয়েবল (.env)</span>
              </h4>
              <button
                onClick={() => copyText(ENV_SAMPLE, 'env')}
                className="px-2.5 py-1 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 flex items-center gap-1 text-[11px]"
              >
                {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEnv ? 'কপি হয়েছে' : 'কপি করুন'}</span>
              </button>
            </div>
            <pre className="p-3 bg-stone-900 text-amber-300 rounded-xl overflow-x-auto text-[11px] font-mono">
              {ENV_SAMPLE}
            </pre>
          </div>

          {/* Step 4: Hosting Deployment */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5 font-bengali">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] flex items-center justify-center">৪</span>
              <span>Firebase Hosting ডিপ্লয়মেন্ট কমান্ড</span>
            </h4>
            <pre className="p-3 bg-stone-900 text-stone-200 rounded-xl overflow-x-auto text-[11px] font-mono">
              npm run build{'\n'}
              firebase init hosting{'\n'}
              firebase deploy --only hosting,firestore:rules
            </pre>
          </div>

          {/* Functionality Checklist */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
            <h5 className="font-bold text-emerald-950 font-bengali flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>ফাংশনালিটি টেস্টিং চেকলিস্ট</span>
            </h5>
            <ul className="space-y-1 text-[11px] text-emerald-900 list-disc list-inside font-bengali">
              <li>৫ ওয়াক্ত সালাত স্বাধীনভাবে ওয়াক্তমতো/দেরিতে/ছুটে গেছে স্ট্যাটাস সংরক্ষণ</li>
              <li>হরফ ৫ ধরে আদায়ের শতকরা হার এবং ডাটা কভারেজের সঠিক হিসাব</li>
              <li>রমাদান ১৪৪৮ কাউন্টডাউন এশিয়া/ঢাকা টাইমজোনে লাইভ গণনা</li>
              <li>কুরআন তিলাওয়াত সেশন ও পৃষ্ঠা সংখ্যা সংরক্ষণ</li>
              <li>গীবত বর্জনের দৈনিক সংকল্প ও চারিত্রিক ডায়েরি সংরক্ষণ</li>
              <li>JSON ও CSV ফরম্যাটে সমস্ত তথ্যের ব্যাকআপ ডাউনলোড</li>
              <li>ডিজিটাল তাসবীহ কাউন্টার ও মাসনূন দুআ সম্ভার</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition"
          >
            বুঝেছি, বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
