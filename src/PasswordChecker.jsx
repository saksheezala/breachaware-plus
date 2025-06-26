import React, { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { sha1 } from 'js-sha1';
import zxcvbn from 'zxcvbn';

function PasswordChecker() {
  const [password, setPassword] = useState('');
  const [isBreach, setIsBreach] = useState('');
  const [debouncedPassword] = useDebounce(password, 500);
  const [strength, setStrength] = useState(null);

  useEffect(() => {
    if (!debouncedPassword) return;

    const hashedPassword = sha1(debouncedPassword);
    const prefix = hashedPassword.slice(0, 5);
    const suffix = hashedPassword.slice(5);

    const strengthResult = zxcvbn(debouncedPassword);

    setStrength({
      score: strengthResult.score,
      warning: strengthResult.feedback.warning,
      suggestions: strengthResult.feedback.suggestions
    });

    const check = async () => {
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const data = await res.text();
      const lines = data.split('\n');

      let matchFound = false;
      for (let line of lines) {
        const [hash, count] = line.split(':');
        if (hash.toLowerCase() === suffix.toLowerCase()) {
          setIsBreach(`⚠️ Your password has been breached ${count} times.`);
          matchFound = true;
          break;
        }
      }

      if (!matchFound) {
        setIsBreach("✅ Your password was not found in any breaches.");
      }
    };

    check();
  }, [debouncedPassword]);

  const getStrengthColor = (score) => {
    switch (score) {
      case 0: return "bg-red-500";
      case 1: return "bg-orange-500";
      case 2: return "bg-yellow-500";
      case 3: return "bg-green-400";
      case 4: return "bg-green-600";
      default: return "bg-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center px-4">
      <div className="backdrop-blur-md bg-white/60 border border-white/30 shadow-xl rounded-3xl p-8 w-full max-w-lg space-y-6 transition-all">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          🛡️ BreachAware+
        </h1>
        <p className="text-center text-sm text-gray-600">
          Check if your password is <span className="font-semibold">strong</span> or <span className="font-semibold">breached</span>.
        </p>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Your Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            placeholder="e.g. mySuperSecurePass123"
          />
        </label>

        <div
          className={`text-center text-sm font-medium transition ${
            isBreach.includes("breached")
              ? "text-red-600"
              : isBreach
              ? "text-green-600"
              : "text-gray-500"
          }`}
        >
          {isBreach}
        </div>

        {strength && (
          <div className="bg-white/70 border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                🔢 Strength Score:
              </span>
              <span className={`text-sm font-bold text-white px-2 py-1 rounded ${getStrengthColor(strength.score)}`}>
                {strength.score} / 4
              </span>
            </div>

            {strength.warning && (
              <p className="text-sm text-yellow-700">⚠️ {strength.warning}</p>
            )}

            {strength.suggestions.length > 0 && (
              <ul className="list-disc ml-5 text-sm text-gray-600">
                {strength.suggestions.map((s, idx) => (
                  <li key={idx}>💡 {s}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PasswordChecker;
