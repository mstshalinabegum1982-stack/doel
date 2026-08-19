import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ArrowRight, Camera, CheckCircle2, Phone, User, MapPin, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { AuthContext } from '../authContext';
import { COUNTRIES, getDefaultDeliveryConfig } from '../utils/countriesData';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    country: 'Bangladesh',
    countryCode: '+880',
    profileImage: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/messenger');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) return null;

  const handleNextStep = async () => {
    setError('');
    if (step === 1) {
      if (!formData.email || !formData.password || formData.password !== formData.confirmPassword) {
        setError('Check password match and required fields');
        return;
      }
      setStep(2); // Jump to Profile Setup
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const newUser = userCredential.user;

      const deliveryConfig = getDefaultDeliveryConfig(formData.country || 'Bangladesh');

      await setDoc(doc(db, 'users', newUser.uid), {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        country: formData.country,
        address: formData.address,
        businessName: '',
        bio: '',
        profileImage: formData.profileImage || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${formData.name}`,
        deliveryLabelInside: formData.country === 'Bangladesh' ? deliveryConfig.deliveryLabelInsideBn : deliveryConfig.deliveryLabelInside,
        deliveryLabelOutside: formData.country === 'Bangladesh' ? deliveryConfig.deliveryLabelOutsideBn : deliveryConfig.deliveryLabelOutside,
        deliveryChargeInside: deliveryConfig.deliveryChargeInside,
        deliveryChargeOutside: deliveryConfig.deliveryChargeOutside,
        customDeliveryCharges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          ordersSent: 0,
          ordersReceived: 0,
          aiUsageCount: 0
        }
      });

      navigate('/messenger');
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, 'users');
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-dragon-black flex items-center justify-center p-6 bg-[radial-gradient(circle_at_bottom_left,_#1a1a2e_0%,_#050505_40%)]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-display font-bold text-dragon-cyan">DRAGON ASCENSION</h2>
          <p className="text-gray-400 mt-2 font-light">Step {step} of 2</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="glass-card p-8 space-y-4"
            >
              <Input label="Name" icon={<User size={18} />} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
              <Input label="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" type="email" />
              
              {/* Country Picker */}
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] uppercase tracking-widest font-bold text-gray-500 ml-1 flex items-center gap-1">
                  <Globe size={11} className="text-gray-500" /> Select Country
                </label>
                <div className="relative">
                  <select
                    value={formData.country}
                    onChange={(e) => {
                      const selectedCountry = e.target.value;
                      const cMatch = COUNTRIES.find(c => c.name === selectedCountry);
                      setFormData(prev => ({
                        ...prev,
                        country: selectedCountry,
                        countryCode: cMatch ? cMatch.code : '+880'
                      }));
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 outline-none focus:border-dragon-cyan/50 focus:bg-white/10 transition-all text-white font-semibold text-sm appearance-none cursor-pointer"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.name} value={country.name} className="bg-dragon-black text-white py-2">
                        {country.name} ({country.code})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    ▼
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="w-24 pt-[1px]">
                   <Input label="Code" value={formData.countryCode} onChange={() => {}} disabled />
                </div>
                <div className="flex-1">
                   <Input label="Phone" icon={<Phone size={18} />} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone Number" />
                </div>
              </div>

              <Input label="Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
              <Input label="Confirm" type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} placeholder="••••••••" />

              {error && <p className="text-red-400 text-xs text-center">{error}</p>}
              
              <button 
                onClick={handleNextStep}
                className="w-full py-4 bg-dragon-cyan text-dragon-black font-bold rounded-2xl flex items-center justify-center gap-2 mt-6 active:scale-95 transition-transform"
              >
                Continue <ArrowRight size={18} />
              </button>
              <p className="text-center text-sm text-gray-400 mt-4">
                Already a Dragon? <button onClick={() => navigate('/login')} className="text-dragon-cyan font-bold underline">Login</button>
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="glass-card p-8 space-y-6"
            >
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-white/5 rounded-full border-2 border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden">
                  <Camera size={24} className="text-gray-500" />
                  <span className="text-[10px] text-gray-500 mt-1">Upload Profile</span>
                </div>
              </div>

              <Input 
                label="Full Address" 
                icon={<MapPin size={18} />} 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                placeholder="123 Dragon Street, Cyan City" 
              />

              {error && <p className="text-red-400 text-xs text-center">{error}</p>}

              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 bg-dragon-cyan text-dragon-black font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Forging Identity..." : "Complete Signup"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Input({ label, icon, value, onChange, placeholder, type = 'text', disabled = false }: any) {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[11px] uppercase tracking-widest font-bold text-gray-500 ml-1">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-dragon-cyan transition-colors">
            {icon}
          </div>
        )}
        <input
          type={type}
          disabled={disabled}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-4 outline-none focus:border-dragon-cyan/50 focus:bg-white/10 transition-all placeholder:text-gray-600",
            icon ? "pl-12" : "pl-4"
          )}
        />
      </div>
    </div>
  );
}
