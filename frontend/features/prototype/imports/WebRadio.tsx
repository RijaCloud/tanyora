// @ts-nocheck
"use client";

// @ts-nocheck
import { useState, useRef } from "react";
import { Link } from "@/features/prototype/router-compat";
import clsx from "clsx";
import svgPaths from "./svg-q6keasuoqz";
import { ShareArrowIcon } from "@/components/ui/ShareArrowIcon";
const imgImage1 = "/prototype-assets/95c2c9e835fb2d55de17370220fb31a3ba680150.png";
import { Clock } from "lucide-react";
const imgAds3 = "/prototype-assets/0c81bdc5da5af2c126817a91e92fcc5d963eb4c6.png";
const imgAds02 = "/prototype-assets/5b10018d9d1c3cba1693af46cf071bfb676ebdee.png";
const imgAds4 = "/prototype-assets/f7f85b12cbfa7c7b47238d957537b7e5b33be8e5.png";
const imgRfiMondeEnDirect = "/prototype-assets/e5f39ec212abc39f3b66d27fcb4fdbb0321e6ba0.png";
const imgRfiMondeEnDirect1 = "/prototype-assets/a59492c8e2b01d0ad4b7fa48cc8ad33473121174.png";
const imgImageRadio = "/prototype-assets/ece298d0ec2c16f10310d45724b276a6035cb503.png";
const imgImageRadio1 = "/prototype-assets/3bf57de301118da6289836397c99aab6b5d352da.png";
const imgImageRadio2 = "/prototype-assets/6cd7f0375548cc7b14912e6ff3baba31f0069978.png";
const imgImageRadio3 = "/prototype-assets/313cac5bd6fda8edf901d0a372751fa16ddd85c8.png";
const imgImageRadio4 = "/prototype-assets/4eda371db0dba3e0012bad797cb49a7bcacdf93c.png";
const imgImageRadio5 = "/prototype-assets/4b50b019e6620f60ae657a475180ffc1e1cb57d0.png";
const imgImageRadio6 = "/prototype-assets/2bd1cf7f83c6b666ac50c4fab44ee44bba77d364.png";
const imgImageRadio7 = "/prototype-assets/62707725923d168c8a4e845abdecc5ee1bd796d7.png";
const imgImageRadio8 = "/prototype-assets/003091feb3fe3436cb01790cd072b46aec2c6b9f.png";
const imgImageRadio9 = "/prototype-assets/9f922d33b14c352f76312b34cec596753089c51c.png";
const imgImageRadio10 = "/prototype-assets/52a050b3e3b5a951bb12b4d2e338bcdd7c4191a8.png";
const imgImageRadio11 = "/prototype-assets/4c83fe6aa63072b282526f25fa85f0557aadfb15.png";
type Text5Props = {
  text: string;
};

function Text5({ text }: Text5Props) {
  return (
    <p style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="relative shrink-0 w-full">
      {text}
    </p>
  );
}

function Wrapper3({ children }: React.PropsWithChildren<{}>) {
  return (
    <p style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="font-['Roboto_Flex:Regular',sans-serif] font-normal leading-[14px] relative shrink-0 text-[#545658] text-[12px] w-full whitespace-pre-wrap">
      {children}
    </p>
  );
}

function ProgramListImageRadio({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[123px] relative rounded-[12px] shrink-0 w-[206px]">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
        {children}
      </div>
    </div>
  );
}

function Wrapper2({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-row items-center justify-center size-full">
      <div className="content-stretch flex gap-[10px] h-full items-center justify-center px-[20px] py-[10px] relative">{children}</div>
    </div>
  );
}

function FooterHelper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-row items-center justify-center size-full">
      <div className="content-stretch flex items-center justify-center p-[10px] relative size-full">{children}</div>
    </div>
  );
}

function FooterHelper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-row items-center justify-center size-full">
      <div className="content-stretch flex h-full items-center justify-center p-[10px] relative">{children}</div>
    </div>
  );
}

function Wrapper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#202224] text-[0px] w-full">
      <p className="font-['Roboto_Flex:Bold',sans-serif] font-bold leading-[14px] text-[12px] whitespace-pre-wrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {children}
      </p>
    </div>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-col items-center size-full">
      <div className="content-stretch flex flex-col gap-[20px] items-center pb-[12px] pt-[4px] px-[16px] relative size-full">{children}</div>
    </div>
  );
}

interface ProgramListRadioCardProps extends React.PropsWithChildren<{}> {
  to?: string;
}

function ProgramListRadioCard({ children, to ="/web-radio" }: ProgramListRadioCardProps) {
  return (
    <Link to={to} className="bg-white h-[278px] relative rounded-[16px] shrink-0 w-[214px] cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
      <div aria-hidden="true" className="absolute border-[2px] border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[16px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
      <Wrapper>{children}</Wrapper>
    </Link>
  );
}

function IconFrame1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[15px] top-1/2">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
        <g id="Icon Frame">{children}</g>
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
type NavProgrammesRadioHelperProps = {
  additionalClassNames?: string;
};

function NavProgrammesRadioHelper({ children, additionalClassNames = "" }: React.PropsWithChildren<NavProgrammesRadioHelperProps>) {
  return (
    <div className={clsx("overflow-clip relative size-[16px]", additionalClassNames)}>
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Icon">
        <div className="absolute inset-[-12.5%_-25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 10">
            {children}
          </svg>
        </div>
      </div>
    </div>
  );
}

function PaginationHelper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="overflow-clip relative shrink-0 size-[24px]">
      <IconFrame>{children}</IconFrame>
    </div>
  );
}
type Text4Props = {
  text: string;
};

function Text4({ text }: Text4Props) {
  return (
    <div className="inline-flex items-center gap-[6px] px-[10px] py-[6px] bg-gradient-to-r from-[#f8f8f8] to-[#f0f0f0] dark:from-[#2a2a2a] dark:to-[#3a3a3a] rounded-[8px] border border-[#e5e5e5] dark:border-[#4a4a4a] shadow-sm">
      <Clock className="w-[14px] h-[14px] text-[#27624f]" strokeWidth={2.5} />
      <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="font-['Roboto_Flex:Medium',sans-serif] font-medium text-[12px] text-[#2c2c2c] dark:text-gray-300 leading-[14px] whitespace-nowrap">
        {text}
      </div>
    </div>
  );
}
type Text3Props = {
  text: string;
};

function Text3({ text }: Text3Props) {
  return <Wrapper1>{text}</Wrapper1>;
}
type Text2Props = {
  text: string;
  additionalClassNames?: string;
};

function Text2({ text, additionalClassNames = "" }: Text2Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] whitespace-nowrap", additionalClassNames)}>
      <p className="leading-[14px]">{text}</p>
    </div>
  );
}
type Text1Props = {
  text: string;
};

function Text1({ text }: Text1Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#171717] dark:text-gray-300 text-[10px] whitespace-nowrap">
      <p className="leading-[normal]">{text}</p>
    </div>
  );
}
type NavProgrammesRadioTextProps = {
  text: string;
  additionalClassNames?: string;
};

function NavProgrammesRadioText({ text, additionalClassNames = "" }: NavProgrammesRadioTextProps) {
  return (
    <div className={clsx("content-stretch flex items-center relative shrink-0", additionalClassNames)}>
      <p className="font-['Roboto_Flex:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[12px] text-black dark:text-white" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text}
      </p>
    </div>
  );
}
type FooterLinksProps = {
  text: string;
  text1: string;
  text2: string;
  text3: string;
  text4: string;
  text5: string;
  text6: string;
  text7: string;
  text8: string;
};

function FooterLinks({ text, text1, text2, text3, text4, text5, text6, text7, text8 }: FooterLinksProps) {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[90px]">
      <Text5 text={text} />
      <Text5 text={text1} />
      <Text5 text={text2} />
      <Text5 text={text3} />
      <Text5 text={text4} />
      <Text5 text={text5} />
      <Text5 text={text6} />
      <Text5 text={text7} />
      <Text5 text={text8} />
    </div>
  );
}
type TextProps = {
  text: string;
};

function Text({ text }: TextProps) {
  return <Wrapper3>{text}</Wrapper3>;
}
type FooterProps = {
  className?: string;
  property1?: "Dark" | "Light";
};

function Footer({ className, property1 = "Dark" }: FooterProps) {
  const isLight = property1 === "Light";
  return (
    null
  );
}

export default function WebRadio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.log("Playback prevented:", error);
              setIsPlaying(false);
            });
        }
      }
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Radio Tanyora - Vaovao Maraina',
        text: 'ÃƒÆ’Ã¢â‚¬Â°coutez Radio Tanyora en direct',
        url: window.location.href,
      }).catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copiÃƒÆ’Ã‚Â© dans le presse-papiers!');
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] relative size-full" data-name="Web Radio">
      {/* Hidden audio element for radio stream */}
      <audio ref={audioRef} src="https://stream.radioTanyora/live" preload="none" />
      
      <div className="content-stretch flex flex-col gap-[24px] items-center w-full relative" data-name="Main Container">
        <div className="content-stretch flex gap-[24px] items-start relative shrink-0 w-[910px] px-[0px] py-[120px]" data-name="Head radio">
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-[246px]" data-name="Blog left">
            <div className="h-[177px] pointer-events-none relative rounded-[16px] shrink-0 w-full" data-name="RFI Monde en direct">
              <div aria-hidden="true" className="absolute inset-0 rounded-[16px]">
                <div className="absolute inset-0 overflow-hidden rounded-[16px]">
                  <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgRfiMondeEnDirect} />
                </div>
                <img alt="" className="absolute max-w-none object-cover rounded-[16px] size-full" src={imgRfiMondeEnDirect1} />
              </div>
              <div aria-hidden="true" className="absolute border border-[#f2f2f2] dark:border-[#3a3a3a] border-solid inset-0 rounded-[16px]" />
            </div>
            <div className="relative shrink-0" data-name="Blog Interaction">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex gap-[14px] items-center relative">
                  <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Like">
                    <div className="overflow-clip relative shrink-0 size-[15px]" data-name="Communication / Like">
                      <IconFrame1>
                        <g id="Base" />
                        <path d={svgPaths.p26e3800} fill="var(--fill-0, #93C5FD)" id="Vector 99" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
                        <path d="M5 6.25V12.5" id="Vector 100" stroke="var(--stroke-0, #292929)" strokeWidth="1.25" />
                      </IconFrame1>
                    </div>
                    <Text1 text="17k" />
                  </div>
                  <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Comment">
                    <div className="overflow-clip relative shrink-0 size-[15px]" data-name="Communication / Comment">
                      <IconFrame1>
                        <g id="Base" />
                        <path d={svgPaths.p13f82a00} id="Ellipse 14" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
                      </IconFrame1>
                    </div>
                    <Text1 text="180" />
                  </div>
                  <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Like">
                    <div className="overflow-clip relative shrink-0 size-[15px]" data-name="Communication / Send">
                      <IconFrame1>
                        <g id="Base" />
                        <path d={svgPaths.p309f5f80} id="Vector 135" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
                      </IconFrame1>
                    </div>
                    <Text1 text="17k" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col h-[176px] items-start justify-between relative shrink-0 w-[603px]" data-name="Blog right">
            <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full" data-name="Blog texte">
              <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-name="Live">
                <div className="col-1 ml-0 mt-0 relative row-1 size-[20px]" data-name="SVG">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                    <g clipPath="url(#clip0_8_1206)" id="SVG">
                      <path d={svgPaths.p3c61da00} fill="var(--fill-0, #E00000)" id="outer" />
                      <path d={svgPaths.p16bc180} fill="var(--fill-0, #E00000)" id="inner" />
                    </g>
                    <defs>
                      <clipPath id="clip0_8_1206">
                        <rect fill="white" height="20" width="20" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <div className="col-1 flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center ml-[25px] mt-[3px] not-italic relative row-1 text-[#e2001a] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  <p className="leading-[14px]">En Direct</p>
                </div>
              </div>
              <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#313131] dark:text-white text-[18px] w-[min-content]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[18px] whitespace-pre-wrap">Vaovao Maraina</p>
              </div>
              <p className="font-['Roboto_Flex:Regular',sans-serif] font-normal leading-[14px] min-w-full not-italic relative shrink-0 text-[#313131] dark:text-gray-300 text-[12px] w-[min-content] whitespace-pre-wrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>{`Restez informÃƒÆ’Ã‚Â© avec Radio Tanyora en direct. Consultez notre programme et ÃƒÆ’Ã‚Â©coutez nos derniers bulletins d'information toutes les 30 minutes. `}</p>
            </div>
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Buttons">
              <div className="content-stretch flex gap-[13px] items-center relative shrink-0">
                <button onClick={handlePlayPause} className="bg-[#27624f] h-[40px] relative rounded-[6px] shrink-0 cursor-pointer hover:bg-[#b51c25] transition-colors" data-name="Button Primary icon">
                  <Wrapper2>
                    <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Image">
                      <div className="absolute left-0 overflow-clip size-[16px] top-0" data-name="image fill">
                        <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[16px] top-1/2" data-name="image">
                          {isPlaying ? (
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                              <rect x="4" y="3" width="3" height="10" fill="white" rx="1" />
                              <rect x="9" y="3" width="3" height="10" fill="white" rx="1" />
                            </svg>
                          ) : (
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                              <g clipPath="url(#clip0_5_5397)" id="image">
                                <path d={svgPaths.p2190b900} fill="var(--fill-0, white)" id="Vector" />
                                <path d={svgPaths.p1d057000} fill="var(--fill-0, #E2001A)" id="Vector_2" />
                                <path d={svgPaths.p3603e200} fill="var(--fill-0, #E2001A)" id="Vector_3" />
                              </g>
                              <defs>
                                <clipPath id="clip0_5_5397">
                                  <rect fill="white" height="16" width="16" />
                                </clipPath>
                              </defs>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                    <Text2 text={isPlaying ? "Pause" : "ÃƒÆ’Ã¢â‚¬Â°couter"} additionalClassNames="text-center text-white" />
                  </Wrapper2>
                </button>
                <div className="bg-white dark:bg-[#2a2a2a] h-[40px] relative rounded-[6px] shrink-0" data-name="Button Secondary">
                  <div aria-hidden="true" className="absolute border border-black dark:border-gray-600 border-solid inset-0 pointer-events-none rounded-[6px]" />
                  <div className="flex flex-row items-center justify-center size-full">
                    <div className="content-stretch flex h-full items-center justify-center px-[28px] py-[10px] relative">
                      <Text2 text="Programmes" additionalClassNames="text-[#313131] dark:text-white text-center" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <button onClick={handleSave} className="flex items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-70 active:scale-95 transition-all" data-name="Button icon" title="Save">
                  {isSaved && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                      enregistrÃƒÆ’Ã‚Â©
                    </span>
                  )}
                  <div className="overflow-clip relative shrink-0 size-[24px]" data-name="General / Favorite">
                    <IconFrame>
                      <g id="Base" />
                      <path
                        d="M21.435 6.582a5.54 5.54 0 00-7.84 0L12 8.177l-1.595-1.595a5.54 5.54 0 00-7.84 7.84l1.595 1.595L12 21.857l7.84-5.84 1.595-1.595a5.54 5.54 0 000-7.84z"
                        id="Vector"
                        fill={isSaved ? "#27624f" : "none"}
                        stroke={isSaved ? "#27624f" : "var(--stroke-0, #292929)"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </IconFrame>
                  </div>
                </button>
                <button onClick={handleShare} className="flex items-center justify-center p-[8px] relative shrink-0 cursor-pointer hover:opacity-70 active:scale-95 transition-all" data-name="Button icon" title="Share">
                  <ShareArrowIcon className="size-[24px] text-[#292929] dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#dfdfdf] dark:bg-[#2a2a2a] h-[220px] relative shrink-0 w-full" data-name="Ads 6">
          <div className="flex flex-col items-center size-full">
            <div className="content-stretch flex flex-col items-center relative size-full">
              <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[31px] justify-center leading-[0] not-italic relative shrink-0 text-[#727272] dark:text-gray-400 text-[9.1px] text-center tracking-[0.5px] uppercase w-full">
                <p className="leading-[10px] whitespace-pre-wrap">PublicitÃƒÆ’Ã‚Â©</p>
              </div>
              <div className="bg-[#dfdfdf] dark:bg-[#2a2a2a] relative shrink-0 w-full" data-name="Ads 5">
                <div aria-hidden="true" className="absolute border-[#dfdfdf] dark:border-[#3a3a3a] border-b border-solid border-t inset-0 pointer-events-none" />
                <div className="content-stretch flex gap-[14px] items-start px-[14px] py-px relative w-full">
                  <div className="flex-[1_0_0] h-[162px] min-h-px min-w-px relative rounded-[12px]" data-name="Ads 3">
                    <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
                      <div className="absolute bg-[#27624f] inset-0 rounded-[12px]" />
                      <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgAds3} />
                    </div>
                    <div className="flex flex-col items-center justify-center overflow-clip rounded-[inherit] size-full">
                      <div className="content-stretch flex flex-col items-center justify-center size-full" />
                    </div>
                  </div>
                  <div className="flex-[1_0_0] h-[162px] min-h-px min-w-px relative rounded-[12px]" data-name="Ads 02">
                    <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
                      <div className="absolute bg-[#27624f] inset-0 rounded-[12px]" />
                      <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgAds02} />
                    </div>
                    <div className="flex flex-col items-center justify-center overflow-clip rounded-[inherit] size-full">
                      <div className="content-stretch flex flex-col items-center justify-center size-full" />
                    </div>
                  </div>
                  <div className="flex-[1_0_0] h-[162px] min-h-px min-w-px relative rounded-[12px]" data-name="Ads 4">
                    <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
                      <div className="absolute bg-[#27624f] inset-0 rounded-[12px]" />
                      <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgAds4} />
                    </div>
                    <div className="flex flex-col items-center justify-center overflow-clip rounded-[inherit] size-full">
                      <div className="content-stretch flex flex-col items-center justify-center size-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#2a2a2a] relative shrink-0 w-full max-w-[913px]" data-name="Nav programmes radio">
          <div aria-hidden="true" className="absolute border-[#f2f2f2] dark:border-[#3a3a3a] border-b border-solid border-t inset-0 pointer-events-none" />
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center justify-between px-[112px] py-[24px] relative w-full">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-[644px]" data-name="Blog categorie">
                <NavProgrammesRadioHelper additionalClassNames="shrink-0">
                  <path d="M5 9L1 5L5 1" id="Icon" stroke="var(--stroke-0, #D4D4D4)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </NavProgrammesRadioHelper>
                <div className="content-stretch flex gap-[24px] items-center overflow-clip relative shrink-0 w-[581px]" data-name="Categories">
                  <NavProgrammesRadioText text="16 FÃƒÆ’Ã‚Â©vrier" />
                  <NavProgrammesRadioText text="17 FÃƒÆ’Ã‚Â©vrier" />
                  <NavProgrammesRadioText text="18 FÃƒÆ’Ã‚Â©vrier" />
                  <div className="content-stretch flex items-center relative shrink-0" data-name="Dashboard Link">
                    <p className="font-['Roboto_Flex:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[12px] text-black dark:text-white" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>{`Aujourd'hui`}</p>
                  </div>
                  <NavProgrammesRadioText text="20 FÃƒÆ’Ã‚Â©vrier" />
                  <NavProgrammesRadioText text="21 FÃƒÆ’Ã‚Â©vrier" additionalClassNames="justify-center" />
                  <NavProgrammesRadioText text="22 FÃƒÆ’Ã‚Â©vrier" additionalClassNames="justify-center" />
                </div>
                <div className="flex items-center justify-center relative shrink-0">
                  <div className="-scale-y-100 flex-none rotate-180">
                    <NavProgrammesRadioHelper>
                      <path d="M5 9L1 5L5 1" id="Icon" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </NavProgrammesRadioHelper>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-start flex flex-wrap gap-[22px_750px] items-start px-[16px] relative shrink-0 w-full max-w-[942px]" data-name="Contents programmes">
          <div aria-hidden="true" className="absolute border-[#f2f2f2] dark:border-[#3a3a3a] border-b border-solid inset-0 pointer-events-none" />
          <div className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black dark:text-white text-center whitespace-nowrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
            <p className="leading-[normal]">{`Aujourd'hui`}</p>
          </div>
          <div className="relative shrink-0 w-[80px]" data-name="Pagination">
            <div className="flex flex-row items-center size-full">
              <div className="content-stretch flex items-center justify-between relative w-full">
                <PaginationHelper>
                  <g id="Base" />
                  <path d="M14 7L9 12" id="Vector" stroke="var(--stroke-0, #A3A3A3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M9 12L14 17" id="Vector_2" stroke="var(--stroke-0, #A3A3A3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </PaginationHelper>
                <PaginationHelper>
                  <g id="Base" />
                  <path d="M10 17L15 12" id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M15 12L10 7" id="Vector_2" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </PaginationHelper>
              </div>
            </div>
          </div>
          <div className="content-start flex flex-wrap gap-[18px] items-start relative shrink-0 w-full max-w-[910px]" data-name="Program List">
            <Link to="/programme/vaovao-maraina" className="bg-white h-[278px] relative rounded-[16px] shrink-0 w-[214px] cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group" data-name="Radio card">
              <div aria-hidden="true" className="absolute border-[2px] border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[16px] transition-colors duration-300 ease-in-out group-hover:border-[#27624f]" />
              <Wrapper>
                <ProgramListImageRadio>
                  <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio} />
                  <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgRfiMondeEnDirect1} />
                </ProgramListImageRadio>
                <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                  <div className="content-stretch flex gap-[5px] items-center relative shrink-0 w-full" data-name="Live">
                    <div className="relative shrink-0 size-[20px]" data-name="SVG">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                        <g clipPath="url(#clip0_8_1199)" id="SVG">
                          <path d={svgPaths.p3c61da00} fill="var(--fill-0, #E00000)" id="outer" />
                          <path d={svgPaths.p16bc180} fill="var(--fill-0, #E00000)" id="inner" />
                        </g>
                        <defs>
                          <clipPath id="clip0_8_1199">
                            <rect fill="white" height="20" width="20" />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                    <Text2 text="En Direct" additionalClassNames="text-[#e2001a]" />
                  </div>
                  <div className="content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full">
                    <Text3 text="Vaovao Maraina" />
                    <Text4 text="06:00 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ 07:00" />
                    <Text text="Journal dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢actualitÃƒÆ’Ã‚Â© nationale et internationale" />
                  </div>
                </div>
              </Wrapper>
            </Link>
            <ProgramListRadioCard to="/programme/fifohazana-mozika">
              <ProgramListImageRadio>
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio1} />
              </ProgramListImageRadio>
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full">
                  <Text3 text="Fifohazana Mozika" />
                  <Text4 text="07:00 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ 09:00" />
                  <Wrapper3>{`Musiques malagasy & internationales`}</Wrapper3>
                </div>
              </div>
            </ProgramListRadioCard>
            <ProgramListRadioCard to="/programme/toekarena-asa">
              <ProgramListImageRadio>
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio1} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio2} />
              </ProgramListImageRadio>
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full">
                  <Wrapper1>{`Toekarena & Asa`}</Wrapper1>
                  <Text4 text="10:00 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ 11:00" />
                  <Text text="ÃƒÆ’Ã¢â‚¬Â°mission ÃƒÆ’Ã‚Â©conomique" />
                </div>
              </div>
            </ProgramListRadioCard>
            <ProgramListRadioCard>
              <ProgramListImageRadio>
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio1} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio2} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio3} />
              </ProgramListImageRadio>
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full">
                  <Text3 text="Fahasalamana ho anÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ny Rehetra" />
                  <Text4 text="10:00 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ 11:00" />
                  <Text text="ÃƒÆ’Ã¢â‚¬Â°mission ÃƒÆ’Ã‚Â©conomique" />
                </div>
              </div>
            </ProgramListRadioCard>
            <ProgramListRadioCard>
              <ProgramListImageRadio>
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio1} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio2} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio3} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio4} />
              </ProgramListImageRadio>
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full">
                  <Text3 text="Midi Infos" />
                  <Text4 text="12:00 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ 13:00" />
                  <Text text="Grand journal" />
                </div>
              </div>
            </ProgramListRadioCard>
            <ProgramListRadioCard>
              <ProgramListImageRadio>
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio1} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio2} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio3} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio4} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio5} />
              </ProgramListImageRadio>
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full">
                  <Text3 text="Tanora Time" />
                  <Text4 text="15:00 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ 16:30" />
                  <Text text="Programme jeunesse" />
                </div>
              </div>
            </ProgramListRadioCard>
            <ProgramListRadioCard>
              <ProgramListImageRadio>
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio1} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio2} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio3} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio4} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio6} />
              </ProgramListImageRadio>
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full">
                  <Text3 text="Sport Mada Live" />
                  <Text4 text="17:00 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ 18:00" />
                  <Text text="ActualitÃƒÆ’Ã‚Â© sportive" />
                </div>
              </div>
            </ProgramListRadioCard>
            <ProgramListRadioCard>
              <ProgramListImageRadio>
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio1} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio2} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio3} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio4} />
                <div className="absolute inset-0 overflow-hidden rounded-[12px]">
                  <img alt="" className="absolute h-[163.55%] left-[-12.18%] max-w-none top-[-53.28%] w-[146.48%]" src={imgImageRadio7} />
                </div>
              </ProgramListImageRadio>
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full">
                  <Text3 text="Adihevitra" />
                  <Text4 text="18:30 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ 19:30" />
                  <Text text="DÃƒÆ’Ã‚Â©bat sociÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© / politique" />
                </div>
              </div>
            </ProgramListRadioCard>
            <ProgramListRadioCard>
              <ProgramListImageRadio>
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio1} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio2} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio3} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio4} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio8} />
              </ProgramListImageRadio>
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full">
                  <Text3 text="Resaka Artista" />
                  <Text4 text="20:00 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ 21:00" />
                  <Text text="Interview artistes malagasy" />
                </div>
              </div>
            </ProgramListRadioCard>
            <ProgramListRadioCard>
              <ProgramListImageRadio>
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio1} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio2} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio3} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio4} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio9} />
              </ProgramListImageRadio>
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full">
                  <Text3 text="Fotoam-bavaka" />
                  <Text4 text="21:30 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ 22:00" />
                  <Text text="Moment spirituel" />
                </div>
              </div>
            </ProgramListRadioCard>
            <ProgramListRadioCard>
              <ProgramListImageRadio>
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio1} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio2} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio3} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio4} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio10} />
              </ProgramListImageRadio>
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full">
                  <Wrapper1>{`Autre programme `}</Wrapper1>
                  <Text4 text="13:00 GMT" />
                  <Text text="The latest five minute news bulletin from BBC World Service." />
                </div>
              </div>
            </ProgramListRadioCard>
            <ProgramListRadioCard>
              <ProgramListImageRadio>
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio1} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio2} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio3} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio4} />
                <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageRadio11} />
              </ProgramListImageRadio>
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full">
                  <Text3 text="Autre programme" />
                  <Text4 text="13:00 GMT" />
                  <Text text="The latest five minute news bulletin from BBC World Service." />
                </div>
              </div>
            </ProgramListRadioCard>
          </div>
        </div>
        <Footer className="bg-white dark:bg-[#0a0a0a] h-[493px] relative shrink-0 w-full" property1="Light" />
      </div>
    </div>
  );
}
