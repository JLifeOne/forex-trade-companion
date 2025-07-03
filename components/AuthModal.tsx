import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { loginWithFirebase, signupWithFirebase } from '../store/authSlice';
import { addToast } from '../store/toastSlice';
import { FaTimes, FaSignInAlt, FaEnvelope, FaLock, FaUserPlus, FaUndo } from 'react-icons/fa';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth'; // Ensure auth compat features are loaded
import { auth } from '../services/firebase'; // Import the auth instance

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgotPassword';

const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_REQUIREMENTS_TEXT = `Min. ${MIN_PASSWORD_LENGTH} chars, Uppercase, Lowercase, Number, Symbol (e.g., !@#$%)`;

const AuthModalComponent: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch: AppDispatch = useDispatch();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }

  const handleCloseModal = () => {
    resetForm();
    setMode('login');
    onClose();
  }

  const validatePassword = (pass: string): boolean => {
    if (pass.length < MIN_PASSWORD_LENGTH) {
      dispatch(addToast({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, type: 'error' }));
      return false;
    }
    if (!/[A-Z]/.test(pass)) {
      dispatch(addToast({ message: 'Password must contain at least one uppercase letter.', type: 'error' }));
      return false;
    }
    if (!/[a-z]/.test(pass)) {
      dispatch(addToast({ message: 'Password must contain at least one lowercase letter.', type: 'error' }));
      return false;
    }
    if (!/\d/.test(pass)) {
      dispatch(addToast({ message: 'Password must contain at least one number.', type: 'error' }));
      return false;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(pass)) {
      dispatch(addToast({ message: 'Password must contain at least one symbol (e.g., !@#$%).', type: 'error' }));
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const resultAction = await dispatch(loginWithFirebase({ email, password }));

    if (loginWithFirebase.fulfilled.match(resultAction)) {
      dispatch(addToast({ message: 'Login successful!', type: 'success' }));
      handleCloseModal();
    } else if (loginWithFirebase.rejected.match(resultAction)) {
      const errorMessage = resultAction.payload || 'Login failed. Please try again.';
      dispatch(addToast({ message: errorMessage, type: 'error' }));
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(password)) {
      return;
    }
    if (password !== confirmPassword) {
      dispatch(addToast({ message: 'Passwords do not match.', type: 'error' }));
      return;
    }
    setIsLoading(true);
    const resultAction = await dispatch(signupWithFirebase({ email, password }));

    if (signupWithFirebase.fulfilled.match(resultAction)) {
      dispatch(addToast({ message: 'Sign up successful! You are now logged in.', type: 'success' }));
      // Email verification toast is handled in authSlice
      handleCloseModal();
    } else if (signupWithFirebase.rejected.match(resultAction)) {
      const errorMessage = resultAction.payload || 'Sign up failed. Please try again.';
      dispatch(addToast({ message: errorMessage, type: 'error' }));
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        dispatch(addToast({ message: 'Please enter your email address.', type: 'info' }));
        return;
    }
    setIsLoading(true);
    try {
      await auth.sendPasswordResetEmail(email);
      dispatch(addToast({ message: `If an account exists for ${email}, a password reset link has been sent. Check your inbox (and spam folder).`, type: 'info', duration: 7000 }));
      setMode('login'); // Switch back to login after initiating
    } catch (error: unknown) {
      const authError = error as firebase.auth.AuthError;
      console.error("Password reset error:", authError);
      let errorMessage = 'Failed to send password reset email. Please try again.';
      if (authError.code === 'auth/user-not-found') {
        // Firebase itself doesn't confirm user existence to prevent enumeration.
        // So, we keep the message vague as in the success case.
         dispatch(addToast({ message: `If an account exists for ${email}, a password reset link has been sent. Check your inbox (and spam folder).`, type: 'info', duration: 7000 }));
         setMode('login');
      } else if (authError.message) {
        errorMessage = authError.message;
        dispatch(addToast({ message: errorMessage, type: 'error' }));
      } else {
        dispatch(addToast({ message: errorMessage, type: 'error' }));
      }
    } finally {
      setIsLoading(false);
    }
  };


  if (!visible) return null;

  const renderContent = () => {
    if (mode === 'signup') {
      return (
        <form onSubmit={handleSignup} className="p-6 space-y-6">
          <div>
            <label htmlFor="email-signup" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <span className="mr-2 text-indigo-400"><FaEnvelope /></span> Email Address
            </label>
            <input type="email" id="email-signup" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500" placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="password-signup" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <span className="mr-2 text-indigo-400"><FaLock /></span> Password
            </label>
            <input type="password" id="password-signup" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500" placeholder={PASSWORD_REQUIREMENTS_TEXT} />
          </div>
           <div>
            <label htmlFor="confirmPassword-signup" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <span className="mr-2 text-indigo-400"><FaLock /></span> Confirm Password
            </label>
            <input type="password" id="confirmPassword-signup" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500" placeholder="Re-enter password" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-md disabled:opacity-50 flex items-center justify-center">
            {isLoading ? 'Signing Up...' : <><span className="mr-2"><FaUserPlus /></span> Sign Up</>}
          </button>
          <p className="text-center text-sm text-gray-400">
            Already have an account? <button type="button" onClick={() => { resetForm(); setMode('login');}} className="font-medium text-indigo-400 hover:text-indigo-300">Login</button>
          </p>
        </form>
      );
    }

    if (mode === 'forgotPassword') {
      return (
        <form onSubmit={handleForgotPassword} className="p-6 space-y-6">
            <p className="text-sm text-gray-300">Enter your email address and we'll send you a link to reset your password.</p>
          <div>
            <label htmlFor="email-forgot" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <span className="mr-2 text-indigo-400"><FaEnvelope /></span> Email Address
            </label>
            <input type="email" id="email-forgot" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500" placeholder="you@example.com" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-4 rounded-md disabled:opacity-50 flex items-center justify-center">
            {isLoading ? 'Sending...' : <><span className="mr-2"><FaUndo /></span> Send Reset Link</>}
          </button>
          <p className="text-center text-sm text-gray-400">
            Remembered your password? <button type="button" onClick={() => { resetForm(); setMode('login');}} className="font-medium text-indigo-400 hover:text-indigo-300">Login</button>
          </p>
        </form>
      );
    }

    // Default: Login mode
    return (
      <form onSubmit={handleLogin} className="p-6 space-y-6">
        <div>
          <label htmlFor="email-login" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
            <span className="mr-2 text-indigo-400"><FaEnvelope /></span> Email Address
          </label>
          <input type="email" id="email-login" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="password-login" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
            <span className="mr-2 text-indigo-400"><FaLock /></span> Password
          </label>
          <input type="password" id="password-login" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center text-gray-400">
            <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-500 bg-gray-700 border-gray-600 rounded mr-2 focus:ring-indigo-400"/>
            Remember me
          </label>
          <button type="button" onClick={() => { resetForm(); setMode('forgotPassword');}} className="font-medium text-indigo-400 hover:text-indigo-300">Forgot password?</button>
        </div>
        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-md disabled:opacity-50 flex items-center justify-center">
          {isLoading ? 'Logging In...' : <><span className="mr-2"><FaSignInAlt /></span> Login</>}
        </button>
        <p className="text-center text-xs text-gray-400">
            Note: Firebase authentication is active.
        </p>
        <div className="text-center">
            <p className="text-sm text-gray-400">
                Don't have an account? <button type="button" onClick={() => { resetForm(); setMode('signup');}} className="font-medium text-indigo-400 hover:text-indigo-300">Sign up</button>
            </p>
         </div>
      </form>
    );
  };

  const getTitle = () => {
    if (mode === 'signup') return 'Create Account';
    if (mode === 'forgotPassword') return 'Reset Password';
    return 'Member Login';
  }
  const getIcon = () => {
    if (mode === 'signup') return <span className="mr-2 text-green-400"><FaUserPlus /></span>;
    if (mode === 'forgotPassword') return <span className="mr-2 text-yellow-400"><FaUndo /></span>;
    return <span className="mr-2 text-indigo-400"><FaSignInAlt /></span>;
  }


  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-gray-800 shadow-2xl rounded-lg w-full max-w-sm flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-indigo-300 flex items-center">
            {getIcon()} {getTitle()}
          </h3>
          <button
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <FaTimes size={20}/>
          </button>
        </div>
        {renderContent()}
         <div className="p-4 bg-gray-750 rounded-b-lg text-xs text-gray-400 text-center">
            Ensure Firebase Security Rules are configured in your Firebase project to protect user data.
        </div>
      </div>
    </div>
  );
};

export default React.memo(AuthModalComponent);