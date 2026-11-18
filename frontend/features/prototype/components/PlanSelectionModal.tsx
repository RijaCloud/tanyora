// @ts-nocheck
"use client";

import { createPortal } from "react-dom";
import { useAuth } from "@/features/prototype/app/context/AuthContext";
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '0',
    period: '',
    description: 'Accès limité au contenu',
    features: ['3 Articles par jour', '5 Annonces par mois', 'Support Standard'],
    value: 'free' as const,
    popular: false,
  },
  {
    name: 'Standard',
    price: '9,99',
    period: '/mois',
    description: 'Parfait pour un usage régulier',
    features: ['30 Articles par jour', 'ILLIMITÉ Annonces', 'Support Prioritaire', 'Accès Web Radio'],
    value: 'pro' as const,
    popular: true,
  },
  {
    name: 'Pro',
    price: '19,99',
    period: '/mois',
    description: 'Accès complet sans limite',
    features: ['ILLIMITÉ Articles', 'ILLIMITÉ Annonces', 'ILLIMITÉ Offres d\'emploi', 'Support Premium 24/7', 'Accès API'],
    value: 'pro' as const,
    popular: false,
  },
];

export function PlanSelectionModal() {
  const { showPlanModal, selectPlan } = useAuth();

  if (!showPlanModal || typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-[100] flex items-center justify-center p-4 overflow-y-auto">
        {/* Modal */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-[20px] p-8 max-w-5xl w-full my-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#1A1A1A] dark:text-white mb-2">
              Choisissez votre plan
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Sélectionnez le plan qui correspond le mieux à vos besoins
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-[20px] p-6 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-[#27624f] shadow-lg dark:bg-[#2a2a2a]'
                    : 'border-[#EAEAEA] dark:border-[#3a3a3a] hover:border-[#27624f] dark:bg-[#2a2a2a]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#27624f] text-white px-4 py-1 rounded-full text-sm font-medium">
                    Populaire
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-[#1A1A1A] dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-[#27624f]">
                      {plan.price}€
                    </span>
                    {plan.period && (
                      <span className="text-gray-600 dark:text-gray-400 text-sm">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{plan.description}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check size={20} className="text-[#27624f] shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => selectPlan(plan.value)}
                  className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
                    plan.popular
                      ? 'bg-[#27624f] text-white hover:bg-[#B51A21]'
                      : 'bg-white dark:bg-[#1a1a1a] text-[#27624f] border-2 border-[#27624f] hover:bg-[#27624f] hover:text-white'
                  }`}
                >
                  Choisir {plan.name}
                </button>
              </div>
            ))}
          </div>

          {/* Note */}
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
            Vous pourrez changer de plan à tout moment depuis votre profil
          </p>
        </div>
      </div>
    </>,
    document.body,
  );
}
