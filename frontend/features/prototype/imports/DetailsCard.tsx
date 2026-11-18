// @ts-nocheck
"use client";

// @ts-nocheck
import { useState } from "react";
import clsx from "clsx";
import { ShareArrowIcon } from "@/components/ui/ShareArrowIcon";
import svgPaths from "./svg-qjisfzvoh2";
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#0a0a0a] w-full", additionalClassNames)}>
      {children}
    </div>
  );
}

function Icon({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="absolute inset-[12.5%]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.25 11.25">
        <g id="icon">{children}</g>
      </svg>
    </div>
  );
}

function IconFrame({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[24px] top-1/2">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon Frame">{children}</g>
      </svg>
    </div>
  );
}
type Text2Props = {
  text: string;
};

function Text2({ text }: Text2Props) {
  return (
    <p style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="font-['Roboto_Flex:Bold',sans-serif] font-bold leading-[normal] text-[12px] whitespace-pre-wrap">
      {text}
    </p>
  );
}
type Text1Props = {
  text: string;
};

function Text1({ text }: Text1Props) {
  return (
    <Wrapper additionalClassNames="font-['Roboto_Flex:Regular',sans-serif] font-normal text-[0px]">
      <Text2 text={text} />
    </Wrapper>
  );
}
type HelperProps = {
  text: string;
  text1: string;
};

function Helper({ text, text1 }: HelperProps) {
  return (
    <div className="content-stretch flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal gap-[6px] items-start leading-[0] not-italic relative shrink-0 text-[#0a0a0a] w-full">
      <div className="flex flex-col justify-center relative shrink-0 text-[0px] w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        <Text2 text={text} />
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[12px] w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        <p className="leading-[normal] whitespace-pre-wrap">{text1}</p>
      </div>
    </div>
  );
}
type TextProps = {
  text: string;
};

function Text({ text }: TextProps) {
  return (
    <Wrapper additionalClassNames="font-['Roboto_Flex:Regular',sans-serif] font-normal text-[12px]">
      <p className="leading-[normal] whitespace-pre-wrap">{text}</p>
    </Wrapper>
  );
}

export default function DetailsCard() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [clickedButtons, setClickedButtons] = useState<Set<string>>(new Set());

  const copyToClipboard = async (text: string, label: string) => {
    try {
      // Fallback method for environments where Clipboard API is blocked
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopiedItem(label);
        setClickedButtons(prev => new Set([...prev, label]));
        setTimeout(() => setCopiedItem(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleBookmark = () => {
    copyToClipboard("Karts Company - Solutions Graphiques", "bookmark");
  };

  const handleShare = () => {
    const shareText = `Karts Company - Solutions Graphiques
Secteur: Informatique & Design
Adresse: Lot IVA 25 Ivato, Antananarivo
Contact: +261 34 12 345 67
Email: contact@kartscompany.mg
Site web: www.kartscompany.mg`;
    copyToClipboard(shareText, "share");
  };

  const handleCopyPhone = () => {
    copyToClipboard("+261 34 12 345 67", "phone");
  };

  const handleCopyEmail = () => {
    copyToClipboard("contact@kartscompany.mg", "email");
  };

  const handleSocialMedia = (platform: string) => {
    const links: { [key: string]: string } = {
      facebook: "https://facebook.com/kartscompany",
      instagram: "https://instagram.com/kartscompany",
      linkedin: "https://linkedin.com/company/kartscompany"
    };
    copyToClipboard(links[platform], platform);
  };

  const handleContact = () => {
    const contactText = `Contact: +261 34 12 345 67\nEmail: contact@kartscompany.mg`;
    copyToClipboard(contactText, "contact");
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] content-stretch flex flex-col items-start overflow-clip p-[24px] relative rounded-[24px] size-full" data-name="Details card">
      <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="Contents">
        <div className="bg-white dark:bg-[#2a2a2a] h-[89px] relative rounded-[16px] shrink-0 w-full" data-name="Header">
          <div aria-hidden="true" className="absolute border border-[#f2f2f2] dark:border-[#3a3a3a] border-solid inset-0 pointer-events-none rounded-[16px]" />
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center justify-between p-[24px] relative size-full">
              <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-[150px]" data-name="Profile">
                <div className="bg-[#a21caf] overflow-clip relative rounded-[30px] shrink-0 size-[35px]" data-name="Logo">
                  <div className="-translate-y-1/2 absolute flex flex-col font-['Acumin_Pro:Bold',sans-serif] justify-center leading-[0] left-[calc(50%-4.5px)] not-italic text-[15px] text-white top-[calc(50%+2px)] whitespace-nowrap">
                    <p className="leading-[15px]">K</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative self-stretch" data-name="Name/location">
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center max-w-[160px] min-h-px min-w-px overflow-clip relative w-[105px]" data-name="Container">
                    <Wrapper additionalClassNames="font-['Roboto_Flex:Bold',sans-serif] font-bold text-[14px] dark:text-white">
                      <p className="leading-[normal] whitespace-pre-wrap">Karts Company</p>
                    </Wrapper>
                  </div>
                </div>
              </div>
              <div className="relative shrink-0" data-name="Interaction buttons">
                <div className="content-stretch flex gap-[8px] items-start relative">
                  <button
                    onClick={handleBookmark}
                    className="flex items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-70 active:scale-95 transition-all"
                    data-name="Button icon"
                    title="Enregistrer"
                  >
                    {copiedItem === "bookmark" && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black text-[10px] px-2 py-1 rounded whitespace-nowrap">
                        enregistrÃƒÆ’Ã‚Â©
                      </span>
                    )}
                    <div className="overflow-clip relative shrink-0 size-[24px]" data-name="General / Favorite">
                      <IconFrame>
                        <g id="Base" />
                        <path
                          d="M21.435 6.582a5.54 5.54 0 00-7.84 0L12 8.177l-1.595-1.595a5.54 5.54 0 00-7.84 7.84l1.595 1.595L12 21.857l7.84-5.84 1.595-1.595a5.54 5.54 0 000-7.84z"
                          id="Vector"
                          fill={clickedButtons.has("bookmark") ? "#27624f" : "none"}
                          stroke={clickedButtons.has("bookmark") ? "#27624f" : "#292929"}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          className="dark:stroke-gray-300"
                        />
                      </IconFrame>
                    </div>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-70 active:scale-95 transition-all"
                    data-name="Button icon"
                    title="Share this job"
                  >
                    {copiedItem === "share" && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black text-[10px] px-2 py-1 rounded whitespace-nowrap">
                        enregistrÃƒÆ’Ã‚Â©
                      </span>
                    )}
                    <ShareArrowIcon className={clsx("size-[24px]", clickedButtons.has("share") ? "text-[#27624f]" : "text-[#292929] dark:text-gray-300")} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] relative rounded-[16px] shrink-0 w-full" data-name="Main Content">
          <div aria-hidden="true" className="absolute border border-[#f2f2f2] dark:border-[#3a3a3a] border-solid inset-0 pointer-events-none rounded-[16px]" />
          <div className="content-stretch flex flex-col items-start p-[24px] relative w-full">
            <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Content Section">
              <div className="content-stretch flex flex-col gap-[12px] items-start not-italic relative shrink-0 text-[#0a0a0a] dark:text-white w-[475px]" data-name="Detail offre">
                <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] w-full dark:text-white" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  <p className="leading-[18px] whitespace-pre-wrap">ÃƒÆ’Ã¢â€šÂ¬ propos de Karts Company</p>
                </div>
                <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[normal] relative shrink-0 text-[12px] w-full whitespace-pre-wrap dark:text-gray-300" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  <p className="mb-0">Karts Company est une agence spÃƒÆ’Ã‚Â©cialisÃƒÆ’Ã‚Â©e dans les solutions graphiques et le design digital basÃƒÆ’Ã‚Â©e ÃƒÆ’Ã‚Â  Madagascar. Nous offrons une gamme complÃƒÆ’Ã‚Â¨te de services crÃƒÆ’Ã‚Â©atifs incluant le design graphique, l'identitÃƒÆ’Ã‚Â© visuelle, la crÃƒÆ’Ã‚Â©ation de sites web, et la production de contenus numÃƒÆ’Ã‚Â©riques.</p>
                  <p className="mb-0">&nbsp;</p>
                  <p className="mb-0">Notre ÃƒÆ’Ã‚Â©quipe de designers expÃƒÆ’Ã‚Â©rimentÃƒÆ’Ã‚Â©s travaille avec des clients locaux et internationaux pour crÃƒÆ’Ã‚Â©er des solutions visuelles innovantes et impactantes. Nous combinons crÃƒÆ’Ã‚Â©ativitÃƒÆ’Ã‚Â©, expertise technique et comprÃƒÆ’Ã‚Â©hension approfondie des besoins de nos clients pour livrer des projets de haute qualitÃƒÆ’Ã‚Â©.</p>
                  <p className="mb-0">&nbsp;</p>
                  <p className="mb-0"><strong>Services principaux :</strong></p>
                  <p className="mb-0">ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Design graphique et identitÃƒÆ’Ã‚Â© visuelle</p>
                  <p className="mb-0">ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ CrÃƒÆ’Ã‚Â©ation de sites web et applications</p>
                  <p className="mb-0">ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Marketing digital et rÃƒÆ’Ã‚Â©seaux sociaux</p>
                  <p className="mb-0">ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Production vidÃƒÆ’Ã‚Â©o et animation</p>
                  <p className="mb-0">ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Impression et supports publicitaires</p>
                  <p className="mb-0">&nbsp;</p>
                  <p>Nous sommes situÃƒÆ’Ã‚Â©s ÃƒÆ’Ã‚Â  Ivato, Antananarivo, et sommes disponibles pour des consultations et des projets sur mesure. N'hÃƒÆ’Ã‚Â©sitez pas ÃƒÆ’Ã‚Â  nous contacter pour discuter de vos besoins en design et communication visuelle.</p>
                </div>
              </div>
              <div className="flex flex-[1_0_0] h-0 items-center justify-center min-h-px min-w-px relative self-center" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19.078125" } as React.CSSProperties}>
                <div className="flex-none rotate-[90.08deg] size-full">
                  <div className="relative size-full">
                    <div className="absolute inset-[-1px_0_0_0]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 380 1">
                        <line id="Line 1" stroke="var(--stroke-0, #F2F2F2)" x2="380" y1="0.5" y2="0.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[23px] items-start pt-[28px] relative shrink-0 w-[169px]" data-name="Job Details">
                <div className="content-stretch flex flex-col gap-[15px] items-start relative shrink-0 w-full" data-name="Job Details Container">
                  <Helper text="Secteur" text1="Informatique & Design" />
                  <Helper text="Adresse" text1="Lot IVA 25 Ivato" />
                  <Helper text="Ville" text1="Antananarivo" />
                  <Helper text="Site web" text1="www.kartscompany.mg" />
                  <Helper text="Effectif" text1="12 employÃƒÆ’Ã‚Â©s" />
                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Contact Container">
                    <Text1 text="Contact" />
                    <button
                      onClick={handleCopyPhone}
                      className="content-stretch flex flex-col items-start relative shrink-0 w-full cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors group"
                      data-name="Contact Value Container"
                      title="Click to copy phone number"
                    >
                      {copiedItem === "phone" && (
                        <span className="absolute -top-8 left-0 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                          enregistrÃƒÆ’Ã‚Â©
                        </span>
                      )}
                      <Text text="+261 34 12 345 67" />
                    </button>
                  </div>
                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Email Container">
                    <Text1 text="Mail" />
                    <button
                      onClick={handleCopyEmail}
                      className="content-stretch flex flex-col items-start relative shrink-0 w-full cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors group"
                      data-name="Email Value Container"
                      title="Click to copy email"
                    >
                      {copiedItem === "email" && (
                        <span className="absolute -top-8 left-0 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                          enregistrÃƒÆ’Ã‚Â©
                        </span>
                      )}
                      <Text text="contact@kartscompany.mg" />
                    </button>
                  </div>
                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Social Media Container">
                    <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#0a0a0a] text-[0px] w-[min-content]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <Text2 text="RÃƒÆ’Ã‚Â©seaux Sociaux" />
                    </div>
                    <div className="content-stretch flex gap-[6px] items-start relative shrink-0" data-name="Icones">
                      <button
                        onClick={() => handleSocialMedia("facebook")}
                        className="relative shrink-0 size-[15px] cursor-pointer hover:opacity-70 active:scale-90 transition-all"
                        data-name="facebook"
                        title="Copy Facebook link"
                      >
                        {copiedItem === "facebook" && (
                          <span className="absolute -top-8 left-0 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                            enregistrÃƒÆ’Ã‚Â©
                          </span>
                        )}
                        <Icon>
                          <path d={svgPaths.p1beb440} fill="var(--fill-0, #212121)" id="Vector" />
                          <path d={svgPaths.p368e3580} fill="var(--fill-0, #212121)" id="Vector_2" />
                        </Icon>
                      </button>
                      <button
                        onClick={() => handleSocialMedia("instagram")}
                        className="relative shrink-0 size-[15px] cursor-pointer hover:opacity-70 active:scale-90 transition-all"
                        data-name="instagram"
                        title="Copy Instagram link"
                      >
                        {copiedItem === "instagram" && (
                          <span className="absolute -top-8 left-0 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                            enregistrÃƒÆ’Ã‚Â©
                          </span>
                        )}
                        <Icon>
                          <path d={svgPaths.p368e3580} fill="var(--fill-0, #212121)" id="Vector" />
                          <path d={svgPaths.p2d39fa00} fill="var(--fill-0, #212121)" id="Vector_2" />
                          <path d={svgPaths.pef92af0} fill="var(--fill-0, #212121)" id="Vector_3" />
                        </Icon>
                      </button>
                      <button
                        onClick={() => handleSocialMedia("linkedin")}
                        className="relative shrink-0 size-[15px] cursor-pointer hover:opacity-70 active:scale-90 transition-all"
                        data-name="linkedin"
                        title="Copy LinkedIn link"
                      >
                        {copiedItem === "linkedin" && (
                          <span className="absolute -top-8 left-0 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                            enregistrÃƒÆ’Ã‚Â©
                          </span>
                        )}
                        <Icon>
                          <path d={svgPaths.p368e3580} fill="var(--fill-0, #212121)" id="Vector" />
                          <path d={svgPaths.p3ea864f0} fill="var(--fill-0, #212121)" id="Vector_2" />
                        </Icon>
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleContact}
                  className="bg-[#2563eb] h-[40px] relative rounded-[6px] shrink-0 w-full cursor-pointer hover:bg-[#1d4ed8] active:scale-95 transition-all"
                  data-name="Button Primary"
                  title="Copy all contact information"
                >
                  {copiedItem === "contact" && (
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                      enregistrÃƒÆ’Ã‚Â©
                    </span>
                  )}
                  <div className="flex flex-row items-center justify-center size-full">
                    <div className="content-stretch flex gap-[10px] items-center justify-center px-[20px] py-[10px] relative size-full">
                      <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                        <p className="leading-[14px]">Contacter</p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
