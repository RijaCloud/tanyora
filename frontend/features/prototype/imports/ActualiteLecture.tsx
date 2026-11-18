// @ts-nocheck
"use client";

// @ts-nocheck
import clsx from "clsx";
import { useState } from "react";
import svgPaths from "./svg-d8i07ze1fe";
const imgLogo = "/prototype-assets/e0b8fdce2f20341a9b9db533fab8dddf4e5f06f9.png";
const imgAds3 = "/prototype-assets/0c81bdc5da5af2c126817a91e92fcc5d963eb4c6.png";
const imgAds02 = "/prototype-assets/5b10018d9d1c3cba1693af46cf071bfb676ebdee.png";
const imgAds4 = "/prototype-assets/f7f85b12cbfa7c7b47238d957537b7e5b33be8e5.png";
const imgMainImage = "/prototype-assets/ece298d0ec2c16f10310d45724b276a6035cb503.png";
const imgMainImage1 = "/prototype-assets/2983b351bc9da3ebd071b56165157142049c227f.png";
const imgLogo1 = "/prototype-assets/a6d2596137ac78b3cf82d0556f1fca3228acf112.png";
const imgLogo2 = "/prototype-assets/ee1fe5c7e15b6234a35a811bb33031043028cd1a.png";
const imgLogo3 = "/prototype-assets/8404ddb1648d6ef962b12ca8edee9b6c3d10f3cd.png";
const imgImageActuCompliment2 = "/prototype-assets/570fd367dcf9f8e65d85c95b81eb82acedb12833.png";
const imgImageActuCompliment3 = "/prototype-assets/234f1aab38a20a7db489f5cec93a52a32afb3cc1.png";

function ComplimentInfoCards({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div className="content-stretch flex flex-col gap-[20px] items-start relative w-full">{children}</div>
    </div>
  );
}

function Wrapper2({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="content-stretch flex flex-col gap-[10px] items-start pl-[36px] relative w-full">{children}</div>
    </div>
  );
}
type Wrapper1Props = {
  additionalClassNames?: string;
};

function Wrapper1({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper1Props>) {
  return (
    <div className={clsx("relative rounded-[12px] shrink-0 w-full", additionalClassNames)}>
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
        {children}
      </div>
    </div>
  );
}

function Ads03Ads({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex-[1_0_0] h-[283px] min-h-px min-w-px relative rounded-[12px]">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
        <div className="absolute bg-[#27624f] inset-0 rounded-[12px]" />
        <div className="absolute inset-0 overflow-hidden rounded-[12px]">{children}</div>
      </div>
      <div className="flex flex-col items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-center justify-center size-full" />
      </div>
    </div>
  );
}

function Avatar({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[25px]">
      <div className="absolute inset-0 pointer-events-none rounded-[930.39px]" data-name="Logo">
        <div aria-hidden="true" className="absolute inset-0 rounded-[930.39px]">
          {children}
        </div>
        <div aria-hidden="true" className="absolute border border-[#27624f] border-solid inset-0 rounded-[930.39px]" />
      </div>
    </div>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="overflow-clip relative shrink-0 size-[15px]">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[15px] top-1/2" data-name="Icon Frame">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
          <g id="Icon Frame">{children}</g>
        </svg>
      </div>
    </div>
  );
}
type Text2Props = {
  text: string;
};

function Text2({ text }: Text2Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#121212] dark:text-white text-[12px] w-full">
      <p className="leading-[normal] whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function Image3() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[930.39px]">
      <img alt="" className="absolute h-[131.2%] left-[-33.08%] max-w-none top-[-0.08%] w-[197.25%]" src={imgLogo2} />
    </div>
  );
}

function ProfileImage1() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0">
      <Avatar>
        <div className="absolute bg-white inset-0 rounded-[930.39px]" />
        <Image1 />
        <Image2 />
        <Image3 />
        <div className="absolute inset-0 overflow-hidden rounded-[930.39px]">
          <img alt="" className="absolute left-[0.09%] max-w-none size-full top-[-2.19%]" src={imgLogo3} />
        </div>
      </Avatar>
      <div className="content-stretch flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal gap-[2px] items-start justify-center leading-[0] not-italic relative shrink-0 text-black whitespace-nowrap">
        <div className="flex flex-col justify-center relative shrink-0 text-[0px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
          <Text1 text="Faniry Hery" additionalClassNames="leading-[normal]" />
        </div>
        <div className="flex flex-col justify-center relative shrink-0 text-[10px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
          <p className="leading-[normal]">{"18 FÃƒÆ’Ã‚Â©vrier 2026"}</p>
        </div>
      </div>
    </div>
  );
}
type Helper1Props = {
  additionalClassNames?: string;
};

function Helper1({ additionalClassNames = "" }: Helper1Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[0px] w-[min-content]", additionalClassNames)}>
      <Text1 text="RÃƒÆ’Ã‚Â©pondre" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
    </div>
  );
}

function Helper() {
  return (
    <div className="bg-white flex-[1_0_0] min-h-px min-w-px relative rounded-[16px]">
      <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="content-stretch flex items-start p-[15px] relative w-full">
        <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
          <div className="flex flex-[1_0_0] flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#090c14] text-[12px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
            <p className="leading-[14px] whitespace-pre-wrap">{`In mauris porttitor tincidunt mauris massa sit lorem sed scelerisque. Fringilla pharetra vel massa enim sollicitudin cras. At pulvinar eget sociis adipiscing eget donec ultricies nibh tristique. `}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Image2() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[930.39px]">
      <img alt="" className="absolute h-[171.25%] left-[-7.06%] max-w-none top-[-0.07%] w-[114.11%]" src={imgLogo1} />
    </div>
  );
}

function ProfileImage() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0">
      <Avatar>
        <div className="absolute bg-white inset-0 rounded-[930.39px]" />
        <Image1 />
        <Image2 />
      </Avatar>
      <div className="content-stretch flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal gap-[2px] items-start justify-center leading-[0] not-italic relative shrink-0 text-black whitespace-nowrap">
        <div className="flex flex-col justify-center relative shrink-0 text-[0px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
          <Text1 text="Voary Nirina" additionalClassNames="leading-[normal]" />
        </div>
        <div className="flex flex-col justify-center relative shrink-0 text-[10px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
          <p className="leading-[normal]">{"17 FÃƒÆ’Ã‚Â©vrier 2026"}</p>
        </div>
      </div>
    </div>
  );
}
type Text1Props = {
  text: string;
  additionalClassNames?: string;
};

function Text1({ text, additionalClassNames = "" }: Text1Props) {
  return (
    <p style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("font-['Roboto_Flex:Bold',sans-serif] font-bold text-[12px]", additionalClassNames)}>
      {text}
    </p>
  );
}
type TextProps = {
  text: string;
};

function Text({ text }: TextProps) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#171717] text-[10px] whitespace-nowrap">
      <p className="leading-[normal]">{text}</p>
    </div>
  );
}

function Image1() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[930.39px]">
      <img alt="" className="absolute h-[63.45%] left-[18.51%] max-w-none top-[18.4%] w-[63.58%]" src={imgLogo} />
    </div>
  );
}
type ImageProps = {
  additionalClassNames?: string;
};

function Image({ additionalClassNames = "" }: ImageProps) {
  return (
    <div aria-hidden="true" className={clsx("absolute inset-0 rounded-[930.39px]", additionalClassNames)}>
      <div className="absolute bg-white inset-0 rounded-[930.39px]" />
      <Image1 />
    </div>
  );
}

function Headline({ className }: { className?: string }) {
  return (
    <div className={className || "relative w-[337px]"} data-name="Headline 2">
      <div className="content-stretch flex flex-col gap-[14px] items-start relative w-full">
        <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
          <div className="content-stretch flex gap-[10px] items-start relative shrink-0" data-name="Profile">
            <div className="pointer-events-none relative rounded-[930.39px] shrink-0 size-[25px]" data-name="Logo">
              <Image />
              <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 rounded-[930.39px]" />
            </div>
            <div className="content-stretch flex flex-col gap-[2px] items-start justify-center leading-[0] not-italic relative shrink-0 text-black whitespace-nowrap">
              <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[10px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[normal]">{`Tanyora ActualitÃƒÆ’Ã‚Â© & Reportages`}</p>
              </div>
              <div className="flex flex-col font-['Roboto_Flex:Light',sans-serif] font-light justify-center relative shrink-0 text-[8px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[normal]">17 FÃƒÆ’Ã‚Â©vrier 2026</p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full whitespace-pre-wrap">
            <p className="font-['Georgia:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#121212] dark:text-white text-[16px] w-full">Andrianina Rajoelisoa, dit Joely, publie "Ifalio ny maraina", son premier recueil de poÃƒÆ’Ã‚Â¨mes chez Hakanto Editions</p>
            <p className="font-['Roboto_Flex:Regular',sans-serif] font-normal leading-[14px] relative shrink-0 text-[#5a5a5a] dark:text-gray-400 text-[12px] w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
              Une autre facette de Joely se dÃƒÆ’Ã‚Â©voilera au public malgache ce mois de fÃƒÆ’Ã‚Â©vrier. Mais ce ne sera pas un nouveau personnage.
            </p>
          </div>
        </div>
        <div className="relative shrink-0" data-name="Interaction">
          <div className="content-stretch flex gap-[5px] items-start relative">
            <Wrapper>
              <g id="Base" />
              <path d={svgPaths.p31025d00} id="Vector" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
            </Wrapper>
            <Wrapper>
              <g id="Base" />
              <path d={svgPaths.pb98340} id="Vector" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
              <path d={svgPaths.p25523a00} id="Vector 137" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
            </Wrapper>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActualiteLecture() {
  const [commentText, setCommentText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(true);

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      console.log("Comment submitted:", commentText);
      // Here you would typically send to backend
      setCommentText("");
      setIsFocused(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] relative size-full" data-name="ACTUALITE LECTURE">
      <div className="absolute content-stretch flex flex-col gap-[24px] items-center left-0 top-0 w-[1440px]" data-name="Container">
        <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[675px]" data-name="Container">
          <div className="bg-[#27624f] h-[17px] relative rounded-[999px] shrink-0">
            <div className="flex flex-row items-center justify-center size-full">
              <div className="content-stretch flex h-full items-center justify-center px-[10px] py-[4px] relative">
                <div className="flex flex-col font-['Roboto_Flex:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[8px] text-white uppercase whitespace-nowrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  <p className="leading-[normal]">{"Actu" === "Live" ? "Live" : "Actu" === "Video" ? "Video" : "Actu" === "Actu" ? "ActualitÃƒÆ’Ã‚Â©" : "ÃƒÆ’Ã¢â€šÂ¬ la une"}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-name="Actu lecture">
            <Wrapper1 additionalClassNames="h-[458px]">
              <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgMainImage} />
              <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgMainImage1} />
            </Wrapper1>
            <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Interaction blog">
              <div className="relative shrink-0" data-name="Blog intercat 01">
                <div className="flex flex-row items-center size-full">
                  <div className="content-stretch flex gap-[14px] items-center relative">
                    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Like">
                      <Wrapper>
                        <g id="Base" />
                        <path d={svgPaths.p26e3800} fill="var(--fill-0, #93C5FD)" id="Vector 99" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
                        <path d="M5 6.25V12.5" id="Vector 100" stroke="var(--stroke-0, #292929)" strokeWidth="1.25" />
                      </Wrapper>
                      <Text text="17k" />
                    </div>
                    <div className="content-stretch flex items-center relative shrink-0 size-[15px]" data-name="Like">
                      <Wrapper>
                        <g id="Base" />
                        <path d={svgPaths.p14848400} id="Vector 99" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
                        <path d="M5 8.75V2.5" id="Vector 100" stroke="var(--stroke-0, #292929)" strokeWidth="1.25" />
                      </Wrapper>
                    </div>
                    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Comment">
                      <Wrapper>
                        <g id="Base" />
                        <path d={svgPaths.p13f82a00} id="Ellipse 14" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
                      </Wrapper>
                      <Text text="180" />
                    </div>
                    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Like">
                      <Wrapper>
                        <g id="Base" />
                        <path d={svgPaths.p309f5f80} id="Vector 135" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
                      </Wrapper>
                      <Text text="17k" />
                    </div>
                    <div className="relative shrink-0 size-[15px]" data-name="Communication / Save">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                        <g id="Communication / Save">
                          <path d={svgPaths.p9466b80} id="Icone-Save" stroke="var(--stroke-0, #171717)" strokeWidth="1.25" />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative shrink-0 size-[22px]" data-name="Save">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22 22">
                  <g id="Save">
                    <path d="M5 4V18L11 13.5L17 18V4H5Z" fill="var(--fill-0, #171717)" id="Vector 1" stroke="var(--stroke-0, #171717)" />
                  </g>
                </svg>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full" data-name="Contes blog">
              <div className="content-stretch flex gap-[10px] items-start relative shrink-0" data-name="Profile">
                <div className="relative rounded-[930.39px] shrink-0 size-[25px]" data-name="Logo">
                  <Image additionalClassNames="pointer-events-none" />
                </div>
                <div className="content-stretch flex flex-col gap-[2px] items-start justify-center leading-[0] not-italic relative shrink-0 text-black whitespace-nowrap" data-name="Profile info">
                  <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center relative shrink-0 text-[0px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    <p className="leading-[16px] text-[16px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>{`Tanyora ActualitÃƒÆ’Ã‚Â© & Reportages`}</p>
                  </div>
                  <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[10px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    <p className="leading-[normal]">17 FÃƒÆ’Ã‚Â©vrier 2026</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col font-['Georgia:Bold',sans-serif] justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[18px] text-black dark:text-white w-[min-content] cursor-pointer hover:text-[#27624f] transition-colors duration-300" onClick={() => (window as any).__navigate__?.('/article/1')}>
                <p className="leading-none whitespace-pre-wrap">DIPLOMATIE ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ La SADC justifie auprÃƒÆ’Ã‚Â¨s de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine son choix de ne pas suspendre Madagascar de ses organes</p>
              </div>
              <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[14px] not-italic relative shrink-0 text-[12px] text-black dark:text-gray-300 w-[675px] whitespace-pre-wrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="mb-0">Des explications. La tenue de la 39ÃƒÆ’Ã‚Â¨me session ordinaire de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢AssemblÃƒÆ’Ã‚Â©e a ÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢occasion pour les responsables de la CommunautÃƒÆ’Ã‚Â© de dÃƒÆ’Ã‚Â©veloppement de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Afrique australe (SADC) dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢expliquer ÃƒÆ’Ã‚Â  la Commission de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine pourquoi elle nÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢a pas sanctionnÃƒÆ’Ã‚Â© Madagascar, comme lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢a fait lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine. ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œLa SADC a choisi de travailler de maniÃƒÆ’Ã‚Â¨re constructive avec les autoritÃƒÆ’Ã‚Â©s intÃƒÆ’Ã‚Â©rimaires afin de faciliter les rÃƒÆ’Ã‚Â©formes et de prÃƒÆ’Ã‚Â©parer le terrain aux ÃƒÆ’Ã‚Â©lections, plutÃƒÆ’Ã‚Â´t que dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢opter pour une suspensionÃƒÂ¢Ã¢â€šÂ¬Ã‚Â, indique un communiquÃƒÆ’Ã‚Â© de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢organisation continentale qui rapporte une rencontre entre Elias Magosi, secrÃƒÆ’Ã‚Â©taire exÃƒÆ’Ã‚Â©cutif de la SADC, et Mohamed Idriss Farah, envoyÃƒÆ’Ã‚Â© spÃƒÆ’Ã‚Â©cial du prÃƒÆ’Ã‚Â©sident de la Commission de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine, ÃƒÆ’Ã‚Â  Addis Abeba.</p>
                <p className="mb-0">&nbsp;</p>
                <p className="mb-0">Pour la SADC, son approche, quÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢elle qualifie ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œrÃƒÆ’Ã‚Â©flÃƒÆ’Ã‚Â©chie, structurÃƒÆ’Ã‚Â©e et ÃƒÆ’Ã‚Â©clairÃƒÆ’Ã‚Â©eÃƒÂ¢Ã¢â€šÂ¬Ã‚Â vise surtout ÃƒÆ’Ã‚Â  ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œfavoriser une solution durable et portÃƒÆ’Ã‚Â©e au niveau nationalÃƒÂ¢Ã¢â€šÂ¬Ã‚Â. Elle nÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢en affirme pas moins que la situation ÃƒÆ’Ã‚Â  Madagascar est traitÃƒÆ’Ã‚Â©e ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œconformÃƒÆ’Ã‚Â©ment aux structures ÃƒÆ’Ã‚Â©tablies de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Organe de la SADC chargÃƒÆ’Ã‚Â© de la politique, de la dÃƒÆ’Ã‚Â©fense et de la coopÃƒÆ’Ã‚Â©ration en matiÃƒÆ’Ã‚Â¨re de sÃƒÆ’Ã‚Â©curitÃƒÆ’Ã‚Â©ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â et quÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢elle demeure ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œfermement engagÃƒÆ’Ã‚Â©e en faveur de la promotion dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢un dialogue inclusif et du respect de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ordre constitutionnelÃƒÂ¢Ã¢â€šÂ¬Ã‚Â. Elias Magosi a notamment ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œinsistÃƒÆ’Ã‚Â© sur lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢importance de tirer les leÃƒÆ’Ã‚Â§ons de la crise de 2011 afin dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â©viter la rÃƒÆ’Ã‚Â©pÃƒÆ’Ã‚Â©tition des difficultÃƒÆ’Ã‚Â©s passÃƒÆ’Ã‚Â©esÃƒÂ¢Ã¢â€šÂ¬Ã‚Â, indique encore le communiquÃƒÆ’Ã‚Â© de la SADC.</p>
                <p className="mb-0">&nbsp;</p>
                <p className="mb-0">LÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢organisation rÃƒÆ’Ã‚Â©gionale attend donc, comme dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  annoncÃƒÆ’Ã‚Â©e, que les autoritÃƒÆ’Ã‚Â©s de la Refondation soumettent ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œdÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ici la fin du mois de fÃƒÆ’Ã‚Â©vrier, un rapport prÃƒÆ’Ã‚Â©sentant les avancÃƒÆ’Ã‚Â©es rÃƒÆ’Ã‚Â©alisÃƒÆ’Ã‚Â©es sur les rÃƒÆ’Ã‚Â©formes convenuesÃƒÂ¢Ã¢â€šÂ¬Ã‚Â. Mais celles-ci sont aussi attendues sur ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œune feuille de route claire pour guider les rÃƒÆ’Ã‚Â©formes institutionnelles et la transition vers un pouvoir civil, devant aboutir ÃƒÆ’Ã‚Â  des ÃƒÆ’Ã‚Â©lections crÃƒÆ’Ã‚Â©dibles et inclusivesÃƒÂ¢Ã¢â€šÂ¬Ã‚Â.</p>
                <p>LÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine qui a suspendu Madagascar de ses organes, pour sa part, a rappelÃƒÆ’Ã‚Â© ÃƒÆ’Ã‚Â  lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢issue de son sommet son ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œengagement sans faille en faveur dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢une tolÃƒÆ’Ã‚Â©rance zÃƒÆ’Ã‚Â©ro ÃƒÆ’Ã‚Â  lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â©gard des changements anticonstitutionnels de gouvernementÃƒÂ¢Ã¢â€šÂ¬Ã‚Â. Lors de sa rencontre avec Elias Magosi, Mohamed Idriss Farah a mis en avant ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œlÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢importance dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢une collaboration ÃƒÆ’Ã‚Â©troite entre lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine et la SADC pour soutenir la transition ÃƒÆ’Ã‚Â  MadagascarÃƒÂ¢Ã¢â€šÂ¬Ã‚Â. Pour lui, bien que Madagascar subisse ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œlÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢impact rÃƒÆ’Ã‚Â©cent de deux cyclones ayant engendrÃƒÆ’Ã‚Â© des besoins humanitaires urgentsÃƒÂ¢Ã¢â€šÂ¬Ã‚Â, le processus de dialogue politique inclusif doit se poursuivre. Il a insistÃƒÆ’Ã‚Â© sur la nÃƒÆ’Ã‚Â©cessitÃƒÆ’Ã‚Â© dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢un ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œappui coordonnÃƒÆ’Ã‚Â© pour accompagnerÃƒÂ¢Ã¢â€šÂ¬Ã‚Â la Grande ÃƒÆ’Ã‚Â®le ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œdans la stabilisation et le relÃƒÆ’Ã‚Â¨vementÃƒÂ¢Ã¢â€šÂ¬Ã‚Â.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#dfdfdf] h-[340px] relative shrink-0 w-[1440px]" data-name="Ads 03">
          <div className="flex flex-col items-center size-full">
            <div className="content-stretch flex flex-col items-center relative size-full">
              <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[31px] justify-center leading-[0] not-italic relative shrink-0 text-[#727272] text-[9.1px] text-center tracking-[0.5px] uppercase w-full">
                <p className="leading-[10px] whitespace-pre-wrap">PublicitÃƒÆ’Ã‚Â©</p>
              </div>
              <div className="bg-[#dfdfdf] relative shrink-0 w-full" data-name="Ads 5">
                <div aria-hidden="true" className="absolute border-[#dfdfdf] border-b border-solid border-t inset-0 pointer-events-none" />
                <div className="content-stretch flex gap-[14px] items-start px-[14px] py-px relative w-full">
                  <Ads03Ads>
                    <img alt="" className="absolute h-full left-[-2.69%] max-w-none top-0 w-[116.16%]" src={imgAds3} />
                  </Ads03Ads>
                  <Ads03Ads>
                    <img alt="" className="absolute h-[163.02%] left-0 max-w-none top-[0.17%] w-full" src={imgAds02} />
                  </Ads03Ads>
                  <Ads03Ads>
                    <img alt="" className="absolute h-[136.66%] left-[-0.02%] max-w-none top-[-0.09%] w-full" src={imgAds4} />
                  </Ads03Ads>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[676px]">
          {/* Comments Header */}
          <button
            onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
            className="content-stretch flex gap-[10px] items-center justify-between relative shrink-0 w-full hover:opacity-80 transition-opacity duration-200"
          >
            <div className="flex items-center gap-[10px]">
              <div className="relative shrink-0 size-[25px]" data-name="Avatar">
                <div className="absolute inset-0 pointer-events-none rounded-[930.39px]" data-name="Logo">
                  <Image />
                  <div aria-hidden="true" className="absolute border border-[#27624f] border-solid inset-0 rounded-[930.39px]" />
                </div>
              </div>
              <div className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#121212] dark:text-white text-[14px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[normal]">Commentaires (180)</p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 transition-transform duration-300 dark:stroke-white ${isCommentsExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="#121212"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Collapsible Comments Content */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out w-full ${
              isCommentsExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="content-stretch flex flex-col gap-[20px] items-start relative w-full pt-[2px]">
              {/* Comment Input */}
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full">
                <div className="relative shrink-0 size-[25px]" data-name="Avatar">
                  <div className="absolute inset-0 pointer-events-none rounded-[930.39px]" data-name="Logo">
                    <Image />
                    <div aria-hidden="true" className="absolute border border-[#27624f] border-solid inset-0 rounded-[930.39px]" />
                  </div>
                </div>
                <div className={`bg-[#f9fafb] flex-[1_0_0] min-h-px min-w-px relative rounded-[999px] transition-all duration-300 ${isFocused ? 'ring-2 ring-[#27624f]' : ''}`}>
                  <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[999px]" />
                  <div className="flex flex-row items-center size-full">
                    <div className="content-stretch flex items-center p-[14px] relative w-full gap-[10px]">
                      <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => {
                            if (!commentText.trim()) setIsFocused(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmitComment();
                          }}
                          placeholder="Add a comment"
                          className="w-full bg-transparent outline-none font-['Roboto_Flex:Regular',sans-serif] font-normal text-[12px] text-[#1f2937] placeholder:text-[#9ca3af]"
                          style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}
                        />
                      </div>
                      {(isFocused || commentText) && (
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input from losing focus
                            handleSubmitComment();
                          }}
                          disabled={!commentText.trim()}
                          className={`px-[16px] py-[6px] rounded-[999px] text-[12px] font-['Roboto_Flex:SemiBold',sans-serif] font-semibold transition-all duration-200 ${
                            commentText.trim()
                              ? 'bg-[#27624f] text-white hover:bg-[#a01820] cursor-pointer'
                              : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                          }`}
                          style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}
                        >
                          Post
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing Comments */}
              <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full">
                <ProfileImage />
                <div className="content-stretch flex items-start relative shrink-0 w-full">
                  <Helper />
                </div>
                <Helper1 additionalClassNames="text-[#1f2937]" />
              </div>
              <Wrapper2>
                <ProfileImage1 />
                <div className="content-stretch flex items-start relative shrink-0 w-full">
                  <Helper />
                </div>
                <Helper1 additionalClassNames="text-[#1f2937]" />
              </Wrapper2>
              <Wrapper2>
                <ProfileImage />
                <div className="content-stretch flex items-start relative shrink-0 w-full">
                  <Helper />
                </div>
                <Helper1 additionalClassNames="text-[#090c14]" />
              </Wrapper2>
              <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex gap-[10px] items-start relative shrink-0" data-name="Profile">
                  <Avatar>
                    <div className="absolute bg-white inset-0 rounded-[930.39px]" />
                    <Image1 />
                    <Image2 />
                    <Image3 />
                  </Avatar>
                  <div className="content-stretch flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal gap-[2px] items-start justify-center leading-[0] not-italic relative shrink-0 text-black whitespace-nowrap" data-name="Profile info">
                    <div className="flex flex-col justify-center relative shrink-0 text-[0px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <Text1 text="Famonjena Soa" additionalClassNames="leading-[normal]" />
                    </div>
                    <div className="flex flex-col justify-center relative shrink-0 text-[10px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[normal]">18 FÃƒÆ’Ã‚Â©vrier 2026</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex items-start relative shrink-0 w-full">
                  <Helper />
                </div>
                <Helper1 additionalClassNames="text-[#1f2937]" />
              </div>
              <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full">
                <ProfileImage1 />
                <div className="content-stretch flex items-start relative shrink-0 w-full">
                  <Helper />
                </div>
                <Helper1 additionalClassNames="text-[#090c14]" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex h-px items-center justify-center relative shrink-0 w-[678px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "0" } as React.CSSProperties}>
          <div className="-rotate-90 flex-none">
            <div className="h-[678px] relative w-px" data-name="Vertical Divider">
              <div aria-hidden="true" className="absolute border-[#dfdfdf] border-l border-solid inset-0 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[23px] items-start relative shrink-0 w-[676px]" data-name="Simulaire">
          <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#27624f] text-[16px] uppercase w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
            <p className="leading-[normal] whitespace-pre-wrap">ARTICLES SimIlaires</p>
          </div>
          <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
            <ComplimentInfoCards>
              <Text2 text="LittÃƒÆ’Ã‚Â©rature" />
              <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Figure">
                <Wrapper1 additionalClassNames="h-[198px]">
                  <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgMainImage} />
                  <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActuCompliment2} />
                </Wrapper1>
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[10.75px] justify-center leading-[0] not-italic relative shrink-0 text-[#727272] text-[8px] text-right w-full">
                </div>
              </div>
              <Headline className="relative shrink-0 w-full" />
            </ComplimentInfoCards>
            <ComplimentInfoCards>
              <Text2 text="LittÃƒÆ’Ã‚Â©rature" />
              <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Figure">
                <Wrapper1 additionalClassNames="h-[198px]">
                  <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgMainImage} />
                  <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActuCompliment3} />
                </Wrapper1>
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[10.75px] justify-center leading-[0] not-italic relative shrink-0 text-[#727272] text-[8px] text-right w-full">
                </div>
              </div>
              <Headline className="relative shrink-0 w-full" />
            </ComplimentInfoCards>
          </div>
        </div>
      </div>
    </div>
  );
}
