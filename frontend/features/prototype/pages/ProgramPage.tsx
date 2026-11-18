// @ts-nocheck
"use client";

import { useParams, Link } from "@/features/prototype/router-compat";
import { Footer } from "@/features/prototype/components/Footer";

interface ProgramData {
  title: string;
  time: string;
  description: string;
  longDescription: string;
  category: string;
}

const programsData: Record<string, ProgramData> = {
  "vaovao-maraina": {
    title: "Vaovao Maraina",
    time: "06:00 – 07:00",
    description: "Journal d'actualité nationale et internationale",
    longDescription: "Vaovao Maraina est le rendez-vous matinal incontournable pour s'informer sur l'actualité nationale et internationale. Présenté par nos journalistes expérimentés, ce journal couvre les événements majeurs, l'économie, la politique et les faits de société à Madagascar et dans le monde.",
    category: "Information"
  },
  "fifohazana-mozika": {
    title: "Fifohazana Mozika",
    time: "07:00 – 09:00",
    description: "Musiques malagasy & internationales",
    longDescription: "Réveillez-vous en musique avec Fifohazana Mozika ! Une sélection des meilleurs hits malagasy et internationaux pour bien commencer la journée. Des morceaux énergiques et des découvertes musicales vous accompagnent chaque matin.",
    category: "Musique"
  },
  "toekarena-asa": {
    title: "Toekarena & Asa",
    time: "10:00 – 11:00",
    description: "Émission économique",
    longDescription: "Toekarena & Asa est votre émission dédiée à l'économie et au monde du travail à Madagascar. Analyses des tendances économiques, conseils pour entrepreneurs, opportunités d'emploi et interviews d'experts vous aident à mieux comprendre le monde professionnel.",
    category: "Économie"
  },
  "fahasalamana": {
    title: "Fahasalamana ho an'ny Rehetra",
    time: "10:00 – 11:00",
    description: "Émission santé",
    longDescription: "Une émission consacrée à votre bien-être et votre santé. Des professionnels de santé répondent à vos questions, donnent des conseils pratiques et abordent les enjeux sanitaires actuels à Madagascar.",
    category: "Santé"
  },
  "midi-infos": {
    title: "Midi Infos",
    time: "12:00 – 13:00",
    description: "Grand journal",
    longDescription: "Le grand rendez-vous d'information de la mi-journée. Midi Infos fait le tour complet de l'actualité nationale et internationale avec des reportages, des interviews et des analyses approfondies des événements marquants.",
    category: "Information"
  },
  "tanora-time": {
    title: "Tanora Time",
    time: "15:00 – 16:30",
    description: "Programme jeunesse",
    longDescription: "Tanora Time est le programme qui donne la parole aux jeunes ! Débats sur les préoccupations de la jeunesse, découvertes culturelles, musique urbaine et témoignages inspirants. Un espace d'expression libre et dynamique.",
    category: "Jeunesse"
  },
  "sport-mada-live": {
    title: "Sport Mada Live",
    time: "17:00 – 18:00",
    description: "Actualité sportive",
    longDescription: "Toute l'actualité sportive malgache et internationale ! Résultats, analyses, interviews d'athlètes et débats passionnés sur le football, le basketball, l'athlétisme et tous les sports qui font vibrer Madagascar.",
    category: "Sport"
  },
  "adihevitra": {
    title: "Adihevitra",
    time: "18:30 – 19:30",
    description: "Débat société / politique",
    longDescription: "Adihevitra est l'émission de débat qui décrypte l'actualité politique et sociétale. Des experts, personnalités et citoyens échangent leurs points de vue sur les grands enjeux qui façonnent Madagascar aujourd'hui.",
    category: "Débat"
  },
  "resaka-artista": {
    title: "Resaka Artista",
    time: "20:00 – 21:00",
    description: "Interview artistes malagasy",
    longDescription: "Resaka Artista vous fait découvrir l'univers des artistes malgaches. Chanteurs, musiciens, comédiens et créateurs partagent leur parcours, leurs projets et leur vision de l'art à Madagascar.",
    category: "Culture"
  },
  "fotoam-bavaka": {
    title: "Fotoam-bavaka",
    time: "21:30 – 22:00",
    description: "Moment spirituel",
    longDescription: "Un moment de recueillement et de réflexion spirituelle pour terminer la journée. Fotoam-bavaka propose des méditations, des chants religieux et des messages d'espoir pour nourrir votre foi.",
    category: "Spiritualité"
  }
};

export default function ProgramPage() {
  const { slug } = useParams<{ slug: string }>();
  const program = slug ? programsData[slug] : null;

  if (!program) {
    return (
      <div className="ui-page-soft min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="ui-text-main mb-4 text-3xl font-bold">Programme non trouvé</h1>
          <Link to="/web-radio" className="text-[#27624f] hover:underline">
            Retour à Web Radio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page-soft min-h-screen">
      <div className="max-w-[1320px] mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="ui-text-muted mb-8 flex items-center gap-2 text-sm">
          <Link to="/" className="hover:text-[#27624f]">Accueil</Link>
          <span>/</span>
          <Link to="/web-radio" className="hover:text-[#27624f]">Web Radio</Link>
          <span>/</span>
          <span className="ui-text-main">{program.title}</span>
        </div>

        {/* Program Header */}
        <div className="ui-card mb-8 rounded-[20px] p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="inline-block bg-[#27624f] text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                {program.category}
              </div>
              <h1 className="ui-text-main mb-2 text-4xl font-bold">{program.title}</h1>
              <div className="ui-text-muted flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#27624f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">{program.time}</span>
                </div>
              </div>
            </div>
            <Link
              to="/web-radio"
              className="ui-surface ui-border-strong ui-text-main rounded-lg border-2 px-6 py-2 transition-all hover:border-[#27624f] hover:text-[#27624f]"
            >
              ← Retour
            </Link>
          </div>
          
          <p className="ui-text-main mb-4 text-lg">{program.description}</p>
          <p className="ui-text-muted leading-relaxed">{program.longDescription}</p>
        </div>

        {/* Live Player Section */}
        <div className="ui-card mb-8 rounded-[20px] p-8">
          <h2 className="ui-text-main mb-4 text-2xl font-bold">Écouter en direct</h2>
          <div className="bg-gradient-to-r from-[#27624f] to-[#a01820] rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-6 h-6 bg-white rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm opacity-90">En direct</p>
                  <p className="font-bold text-lg">Radio Tanyora</p>
                </div>
              </div>
              <button className="bg-white text-[#27624f] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Écouter
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="ui-card rounded-[20px] p-6">
            <h3 className="ui-text-main mb-4 text-xl font-bold">Informations pratiques</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="ui-text-muted">Horaire :</span>
                <span className="ui-text-main font-semibold">{program.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="ui-text-muted">Catégorie :</span>
                <span className="ui-text-main font-semibold">{program.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="ui-text-muted">Fréquence :</span>
                <span className="ui-text-main font-semibold">Quotidien</span>
              </div>
            </div>
          </div>

          <div className="ui-card rounded-[20px] p-6">
            <h3 className="ui-text-main mb-4 text-xl font-bold">Partager</h3>
            <div className="flex gap-3">
              <button className="flex-1 bg-[#3b5998] text-white py-3 rounded-lg hover:opacity-90 transition-all">
                Facebook
              </button>
              <button className="flex-1 bg-[#1da1f2] text-white py-3 rounded-lg hover:opacity-90 transition-all">
                Twitter
              </button>
              <button className="ui-surface-soft ui-text-main flex-1 rounded-lg py-3 transition-all hover:bg-[var(--surface-4)]">
                Copier
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
