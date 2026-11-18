// @ts-nocheck
"use client";

// @ts-nocheck
import clsx from "clsx";
const imgAds3 = "/prototype-assets/0c81bdc5da5af2c126817a91e92fcc5d963eb4c6.png";
const imgAds02 = "/prototype-assets/5b10018d9d1c3cba1693af46cf071bfb676ebdee.png";
const imgAds4 = "/prototype-assets/f7f85b12cbfa7c7b47238d957537b7e5b33be8e5.png";
import svgPaths from "./svg-efimawrs95";
const imgRectangle4848 = "/prototype-assets/dfc3624f268495edc493c7c6df1be9f622e5809c.png";
const imgImagePetitesAnnonces = "/prototype-assets/ece298d0ec2c16f10310d45724b276a6035cb503.png";
const imgImagePetitesAnnonces1 = "/prototype-assets/60c694b9f36256d02658c65f32a80af42f96d229.png";
const imgImagePetitesAnnonces2 = "/prototype-assets/72d023aedfdc4aaca7262457bf736389092701b8.png";
const imgImagePetitesAnnonces3 = "/prototype-assets/7f88ed60fba8530cd4b283775351ebddbf78e8a5.png";
const imgImagePetitesAnnonces4 = "/prototype-assets/0325b063b538d46b08bb01eaf4883844c1c414a4.png";
const imgImagePetitesAnnonces5 = "/prototype-assets/eed8fce34db4ac97a83ba23f58da6bd8e189e213.png";
const imgImagePetitesAnnonces6 = "/prototype-assets/c37371f992cab2b931064463769f34cb7d8ef47c.png";
const imgImagePetitesAnnonces7 = "/prototype-assets/d94a03ed6a56eda9a7cae1f9d85e3a5561eeac06.png";
const imgImagePetitesAnnonces8 = "/prototype-assets/71bb5176cbe70b1a208aedf88a47a5af62e694b0.png";
const imgImagePetitesAnnonces9 = "/prototype-assets/5b11e11b65400842e4c609e64fea8abab06ffc5f.png";
const imgImagePetitesAnnonces10 = "/prototype-assets/12a6239f76ce73d98ab3aa22492695a33d96f53e.png";
const imgImagePetitesAnnonces11 = "/prototype-assets/1b5ade328d8657dac1727cbc09f03013103365e7.png";
const imgImagePetitesAnnonces12 = "/prototype-assets/33a0225e1ea6ae9c770ca004bff539f138a2fc39.png";
const imgImagePetitesAnnonces13 = "/prototype-assets/ee98101e5747ec328513c8c77654eb04b31e509c.png";
const imgImagePetitesAnnonces14 = "/prototype-assets/32d8a11e4dedfe8e2dc8e3a22f6480570c0465dc.png";
const imgImagePetitesAnnonces15 = "/prototype-assets/29ec9cf04f0638f2ef0e5b04c88221dd57d811cb.png";
type HeadingHelperProps = {
  additionalClassNames?: string;
};

function HeadingHelper({ children, additionalClassNames = "" }: React.PropsWithChildren<HeadingHelperProps>) {
  return (
    <span style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("leading-[normal]", additionalClassNames)}>
      {children}
    </span>
  );
}

function Wrapper5({ children, text, additionalClassNames = "" }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic overflow-hidden relative shrink-0 text-[#262626] text-[0px] text-ellipsis w-full">
      <p style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("font-['Roboto_Flex:Bold',sans-serif] font-bold text-[12px]", additionalClassNames)}>
        {text}
      </p>
    </div>
  );
}

function CardsAo({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-white relative rounded-[12px] shrink-0 w-[180px]">
      <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex flex-col gap-[20px] items-start p-[5px] relative w-full">{children}</div>
    </div>
  );
}

function HorizontalBorder({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#e8e8e8] border-solid border-t inset-0 pointer-events-none" />
      <div className="content-stretch flex flex-col items-start pb-[10px] pl-[10px] pr-[16px] pt-[11px] relative w-full">{children}</div>
    </div>
  );
}

function Label({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="content-stretch flex items-start pl-[25px] pt-[2px] relative w-full">{children}</div>
    </div>
  );
}

function HeadingButton({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[32px] relative shrink-0 w-full">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5px] items-center relative size-full">{children}</div>
    </div>
  );
}
type ContainerProps = {
  text: string;
  additionalClassNames?: string;
};

function Container({ children, text, additionalClassNames = "" }: React.PropsWithChildren<ContainerProps>) {
  return (
    <div className="content-stretch flex items-start relative shrink-0">
      <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#191919] text-[0px] whitespace-nowrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        <p style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("font-['Roboto_Flex:Bold',sans-serif] font-bold text-[12px]", additionalClassNames)}>
          {text}
        </p>
      </div>
    </div>
  );
}

function CardsParent({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[20px] items-start p-[14px] relative w-full">{children}</div>
    </div>
  );
}

function Time({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative">
      <div className="content-stretch flex flex-col items-start pb-[0.59px] pl-[3.08px] relative w-full">{children}</div>
    </div>
  );
}

function HeaderFreeUserDropdownIcon({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="overflow-clip relative shrink-0 size-[12.632px]">
      <div className="absolute inset-[28.63%_10.51%_28.75%_10.51%]" data-name="Group">
        {children}
      </div>
    </div>
  );
}

function HeaderFreeUserHelper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-row items-center size-full">
      <div className="content-stretch flex items-center justify-between px-[4px] py-[2px] relative size-full">{children}</div>
    </div>
  );
}

function Wrapper4({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative size-[10px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        {children}
      </svg>
    </div>
  );
}

function Wrapper3({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[135px] relative rounded-[6px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 pointer-events-none rounded-[6px]">
        {children}
      </div>
      <Helper />
    </div>
  );
}

function ImagePetitesAnnoncesImage4({ children }: React.PropsWithChildren<{}>) {
  return (
    <Wrapper3>
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces} />
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden rounded-[6px]">{children}</div>
    </Wrapper3>
  );
}

function Wrapper2({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-row items-center self-stretch">
      <div className="bg-white h-full relative rounded-[12px] shrink-0 w-[180px]" data-name="Cards AO">
        <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[12px]" />
        <div className="content-stretch flex flex-col gap-[20px] items-start p-[5px] relative size-full">{children}</div>
      </div>
    </div>
  );
}
type Wrapper1Props = {
  additionalClassNames?: string;
};

function Wrapper1({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper1Props>) {
  return (
    <div className={clsx("content-stretch flex flex-col h-[11px] items-start pt-px relative w-[10px]", additionalClassNames)}>
      <div className="flex items-center justify-center relative shrink-0 size-[10px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "153.625" } as React.CSSProperties}>
        <div className="flex-none rotate-90">{children}</div>
      </div>
    </div>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="overflow-clip relative shrink-0 size-[24px]">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[24px] top-1/2" data-name="Icon Frame">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <g id="Icon Frame">{children}</g>
        </svg>
      </div>
    </div>
  );
}

function ImagePetitesAnnoncesImage3() {
  return (
    <div className="h-[135px] relative rounded-[6px] shrink-0 w-full">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-cover pointer-events-none rounded-[6px] size-full" src={imgImagePetitesAnnonces3} />
      <Helper />
    </div>
  );
}

function Container1() {
  return (
    <Wrapper1 additionalClassNames="shrink-0">
      <Wrapper4>
        <g clipPath="url(#clip0_4_2497)" id="SVG">
          <path d={svgPaths.p9344b80} fill="var(--fill-0, #474747)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_4_2497">
            <rect fill="white" height="10" width="10" />
          </clipPath>
        </defs>
      </Wrapper4>
    </Wrapper1>
  );
}
type RadioButtonProps = {
  additionalClassNames?: string;
};

function RadioButton({ additionalClassNames = "" }: RadioButtonProps) {
  return (
    <div className={clsx("-translate-y-1/2 absolute bg-white left-0 rounded-[16px] size-[16px]", additionalClassNames)}>
      <div aria-hidden="true" className="absolute border border-[#a3a3a3] border-solid inset-0 pointer-events-none rounded-[16px]" />
    </div>
  );
}

function ImagePetitesAnnoncesImage2() {
  return (
    <Wrapper3>
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces} />
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces5} />
    </Wrapper3>
  );
}

function ImagePetitesAnnoncesImage1() {
  return (
    <Wrapper3>
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces} />
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces2} />
    </Wrapper3>
  );
}
type Text5Props = {
  text: string;
};

function Text5({ text }: Text5Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#737373] text-[0px] whitespace-nowrap">
      <p className="font-['Roboto_Flex:Regular',sans-serif] font-normal leading-[normal] text-[12px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text}
      </p>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents inset-[6.93%_0_6.92%_0]">
      <div className="absolute inset-[6.93%_0_6.92%_0]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.00007 11.1998">
          <path d={svgPaths.p133f400} fill="var(--fill-0, #737373)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}
type Text3Props = {
  text: string;
  additionalClassNames?: string;
};

function Text3({ text, additionalClassNames = "" }: Text3Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[#0a0a0a] w-full", additionalClassNames)}>
      <p className="leading-[normal] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type Text4Props = {
  text: string;
  additionalClassNames?: string;
};

function Text4({ text, additionalClassNames = "" }: Text4Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("flex flex-[1_0_0] flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] min-h-px min-w-px not-italic relative", additionalClassNames)}>
      <p className="leading-[normal] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type ContainerTextProps = {
  text: string;
};

function ContainerText({ text }: ContainerTextProps) {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col h-[18px] items-start max-w-[160px] min-h-px min-w-px overflow-clip relative">
      <Text3 text={text} additionalClassNames="font-['Roboto_Flex:Bold',sans-serif] font-bold text-[14px]" />
    </div>
  );
}
type LogoTextProps = {
  text: string;
  additionalClassNames?: string;
};

function LogoText({ text, additionalClassNames = "" }: LogoTextProps) {
  return (
    <div className={clsx("overflow-clip relative rounded-[30px] shrink-0 size-[35px]", additionalClassNames)}>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Acumin_Pro:Bold',sans-serif] justify-center leading-[0] left-[calc(50%-4.5px)] not-italic text-[15px] text-white top-[calc(50%+2px)] whitespace-nowrap">
        <p className="leading-[15px]">{text}</p>
      </div>
    </div>
  );
}

function Helper() {
  return (
    <div className="flex flex-col items-end overflow-clip rounded-[inherit] size-full">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-end p-[10px] relative size-full">
        <div className="relative shrink-0 size-[15px]" data-name="Union">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
            <path d={svgPaths.p1d0f4800} fill="var(--fill-0, white)" id="Union" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ImagePetitesAnnoncesImage() {
  return (
    <Wrapper3>
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces} />
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces1} />
    </Wrapper3>
  );
}
type Text2Props = {
  text: string;
  additionalClassNames?: string;
};

function Text2({ text, additionalClassNames = "" }: Text2Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={additionalClassNames}>
      <p className="leading-[normal]">{text}</p>
    </div>
  );
}
type Text1Props = {
  text: string;
  additionalClassNames?: string;
};

function Text1({ text, additionalClassNames = "" }: Text1Props) {
  return <Text2 text={text} additionalClassNames={clsx("flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-white uppercase whitespace-nowrap", additionalClassNames)} />;
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return <Text2 text={text} additionalClassNames={clsx("flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] whitespace-nowrap", additionalClassNames)} />;
}

function Ads({ className }: { className?: string }) {
  return (
    <div className={className || "bg-[#27624f] h-[352px] relative rounded-[12px] w-[180px]"} data-name="Ads 7">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center overflow-clip px-[10px] py-[81px] relative size-full">
          <div className="content-stretch flex flex-col gap-[14.488px] items-center justify-center relative shrink-0">
            <div className="relative shrink-0 size-[22.859px]" data-name="Union">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.8584 22.8584">
                <path d={svgPaths.p165fc700} fill="var(--fill-0, white)" id="Union" />
              </svg>
            </div>
            <Text1 text="Votre Pub ICI" additionalClassNames="text-[19.487px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
type HeaderFreeUserProps = {
  className?: string;
  property1?: "Dark" | "light";
};

function HeaderFreeUser({ className, property1 = "Dark" }: HeaderFreeUserProps) {
  const isLight = property1 === "light";
  return (
    <div className={className || "min-w-[1220px] relative w-[1440px]"}>
      <div className="flex flex-row items-center min-w-[inherit] size-full">
        <div className="content-stretch flex items-center justify-between min-w-[inherit] px-[32px] py-[24px] relative w-full">
          <div className="content-stretch flex gap-[20px] items-center relative shrink-0" data-name="Logo and Navigation">
            <div className="relative shrink-0 size-[42px]" data-name="Union">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 42 42">
                <path d={svgPaths.p3b8d2580} fill="var(--fill-0, #27624f)" id="Union" />
              </svg>
            </div>
            <div className="content-stretch flex gap-[14px] items-center relative shrink-0" data-name="Navigation">
              <div className="content-stretch flex items-center relative shrink-0" data-name="Dashboard Link">
                <p className={`font-["Roboto_Flex:Regular",sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[12px] ${isLight ? "text-black" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  Accueil
                </p>
              </div>
              <div className="content-stretch flex items-center relative shrink-0" data-name="Order Link">
                <p className={`font-["Roboto_Flex:Regular",sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[12px] ${isLight ? "text-black" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  ActualitÃƒÆ’Ã‚Â©s
                </p>
              </div>
              <div className="content-stretch flex items-center relative shrink-0" data-name="Static Link">
                <p className={`font-["Roboto_Flex:Regular",sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[12px] ${isLight ? "text-black" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  Petites Annonces
                </p>
              </div>
              <div className="content-stretch flex items-center relative shrink-0" data-name="Static Link">
                <p className={`font-["Roboto_Flex:Regular",sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[12px] ${isLight ? "text-black" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  Appel dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Offres
                </p>
              </div>
              <div className="content-stretch flex items-center relative shrink-0" data-name="Static Link">
                <p className={`font-["Roboto_Flex:Regular",sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[12px] ${isLight ? "text-black" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  Offres dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢emploi
                </p>
              </div>
              <div className="content-stretch flex items-center relative shrink-0" data-name="Static Link">
                <p className={`font-["Roboto_Flex:Regular",sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[12px] ${isLight ? "text-black" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  Web Radio
                </p>
              </div>
              <div className="content-stretch flex items-center relative shrink-0" data-name="Static Link">
                <p className={`font-["Roboto_Flex:Regular",sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[12px] ${isLight ? "text-black" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  Annuaire
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[14px] items-center justify-center relative shrink-0" data-name="Infopratique">
            <div className="overflow-clip relative rounded-[4px] shrink-0 size-[24px]" data-name="iconoir:pharmacy-cross-tag">
              <div className="absolute inset-[11.99%_12.5%_13.01%_12.5%]" data-name="Group">
                <div className="absolute inset-[-5.56%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                    <g id="Group">
                      <path d={svgPaths.p1ab8fc00} id="Vector" stroke={isLight ? "var(--stroke-0, black)" : "var(--stroke-0, #FAFAFA)"} strokeWidth="2" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
            <div className="overflow-clip relative shrink-0 size-[24px]" data-name="plane">
              <div className="absolute inset-[8.57%_8.29%_8.56%_9.4%]" data-name="Icon">
                <div className="absolute inset-[-5.03%_-5.06%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.7556 21.8898">
                    <path d={svgPaths.p135a9f00} id="Icon" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="h-[46.245px] relative shrink-0 w-[103px]" data-name="Weather">
              <div className="absolute contents inset-0">
                <div className={`absolute bg-[#4992ff] inset-0 ${isLight ? "rounded-[8px]" : "rounded-[19px]"}`} />
              </div>
              <p className={`absolute font-["Roboto_Flex:Bold",sans-serif] font-bold inset-[13.64%_44.9%_33.33%_9.52%] leading-[normal] not-italic text-white whitespace-pre-wrap ${isLight ? "text-[13.91px]" : "text-[20.85px]"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                25Ãƒâ€šÃ‚ÂºC
              </p>
              <p className="absolute font-['Product_Sans:Regular',sans-serif] inset-[60.61%_51.02%_21.21%_9.52%] leading-[normal] not-italic text-[7.01px] text-[rgba(255,255,255,0.35)] whitespace-pre-wrap">Antananarivo</p>
              <div className="absolute inset-[20.1%_16.67%_43.18%_68.52%]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
                  <g id="Ellipse 4" />
                </svg>
              </div>
              <div className="absolute inset-[24.24%_21.77%_46.97%_65.31%]">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox={isLight ? "0 0 13.3129 13.3129" : "0 0 19 19"}>
                  <circle cx={isLight ? "6.65646" : "9.5"} cy={isLight ? "6.65646" : "9.5"} fill="var(--fill-0, #FFAC63)" id="Ellipse 22" r={isLight ? "6.65646" : "9.5"} />
                </svg>
              </div>
              <div className="absolute inset-[33.33%_6.12%_18.18%_64.63%]" data-name="Vector">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox={isLight ? "0 0 30.1293 22.4218" : "0 0 43 32"}>
                  <g filter={isLight ? "url(#filter0_i_1_1083)" : "url(#filter0_i_1_976)"} id="Vector">
                    <path d={isLight ? svgPaths.p1084f00 : svgPaths.p223fa300} fill="var(--fill-0, #FAFAFA)" fillOpacity="0.74" />
                    <path d={isLight ? svgPaths.pcfd0180 : svgPaths.p3fc2e600} fill="var(--fill-0, #FAFAFA)" fillOpacity="0.74" />
                  </g>
                  <defs>
                    <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height={isLight ? "30.8299" : "44"} id={isLight ? "filter0_i_1_1083" : "filter0_i_1_976"} width={isLight ? "38.5374" : "55"} x="0" y={isLight ? "-8.40816" : "-12"}>
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                      <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                      <feOffset dx={isLight ? "8.40816" : "12"} dy={isLight ? "-8.40816" : "-12"} />
                      <feGaussianBlur stdDeviation={isLight ? "7.35714" : "10.5"} />
                      <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                      <feColorMatrix type="matrix" values="0 0 0 0 0.105882 0 0 0 0 0.356863 0 0 0 0 1 0 0 0 0.3 0" />
                      <feBlend in2="shape" mode="normal" result={isLight ? "effect1_innerShadow_1_1083" : "effect1_innerShadow_1_976"} />
                    </filter>
                  </defs>
                </svg>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[8px] items-start py-[10px] relative rounded-[4px] shrink-0 w-[137px]" data-name="Exchange">
              <div className={`h-[19px] relative rounded-[8px] shrink-0 w-full ${isLight ? "bg-[#f9fafb]" : "bg-[#fafafa]"}`} data-name="Country Info">
                <HeaderFreeUserHelper>
                  <div className="content-stretch flex gap-[3.368px] items-center p-[1.684px] relative rounded-[1.684px] shrink-0" data-name="Country Flag">
                    <div className="h-[9.09px] relative shrink-0 w-[12.877px]" data-name="United States of America (US)">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.8772 9.08978">
                        <g id="United States of America (US)">
                          <g clipPath="url(#clip0_1_1068)">
                            <path d={svgPaths.p3c11f504} fill="var(--fill-0, #BD3D44)" id="Vector" />
                            <path d={svgPaths.p39f7cf00} fill="var(--fill-0, black)" id="Vector_2" />
                            <path d={svgPaths.p2ab29700} fill="var(--fill-0, white)" id="Vector_3" />
                            <path d={svgPaths.p1594e100} fill="var(--fill-0, #192F5D)" id="Vector_4" />
                            <g id="Group">
                              <path d={svgPaths.p15a0ff80} fill="var(--fill-0, white)" id="Vector_5" />
                            </g>
                          </g>
                        </g>
                        <defs>
                          <clipPath id="clip0_1_1068">
                            <path d={svgPaths.p1f8f4e80} fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                    <HeaderFreeUserDropdownIcon>
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox={isLight ? "0 0 9.97697 5.38322" : "0 0 18.9562 10.2281"}>
                        <g id="Group">
                          <path d={isLight ? svgPaths.p3789e080 : svgPaths.p22f80c00} fill={isLight ? "var(--fill-0, #111827)" : "var(--fill-0, #111928)"} id="Vector" />
                        </g>
                      </svg>
                    </HeaderFreeUserDropdownIcon>
                  </div>
                  <div className={`content-stretch flex font-["Roboto_Flex:Regular",sans-serif] font-normal gap-[4px] items-center leading-[normal] not-italic relative shrink-0 ${isLight ? "text-[#111827]" : ""}`}>
                    <p className={`relative shrink-0 text-[12px] ${isLight ? "" : "text-[#404040]"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      1
                    </p>
                    <p className={`relative shrink-0 text-[10px] ${isLight ? "" : "text-[#262626]"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      USA
                    </p>
                  </div>
                </HeaderFreeUserHelper>
              </div>
              <div className="bg-[#d4d4d4] h-[19px] relative rounded-[8px] shrink-0 w-full" data-name="Country Info">
                <HeaderFreeUserHelper>
                  <div className="content-stretch flex gap-[3.368px] items-center p-[1.684px] relative rounded-[1.684px] shrink-0" data-name="Country Flag">
                    <div className="h-[9.053px] overflow-clip relative rounded-[1.685px] shrink-0 w-[12.07px]" data-name="Madagascar (MG)">
                      <div className="absolute inset-[0_2.33%_-2.32%_0]" data-name="Group">
                        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.7896 9.26317">
                          <g id="Group">
                            <path clipRule="evenodd" d={svgPaths.p332350d0} fill="var(--fill-0, #FC3D32)" fillRule="evenodd" id="Vector" />
                            <path clipRule="evenodd" d={svgPaths.pb07a080} fill="var(--fill-0, #007E3A)" fillRule="evenodd" id="Vector_2" />
                            <path clipRule="evenodd" d={svgPaths.p3d821c00} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector_3" />
                          </g>
                        </svg>
                      </div>
                    </div>
                    <HeaderFreeUserDropdownIcon>
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox={isLight ? "0 0 9.97697 5.38322" : "0 0 18.9562 10.2281"}>
                        <g id="Group">
                          <path d={isLight ? svgPaths.p3789e080 : svgPaths.p22f80c00} fill={isLight ? "var(--fill-0, #111827)" : "var(--fill-0, #111928)"} id="Vector" />
                        </g>
                      </svg>
                    </HeaderFreeUserDropdownIcon>
                  </div>
                  <div className={`content-stretch flex gap-[4px] items-center leading-[normal] not-italic relative shrink-0 ${isLight ? "text-[#111827]" : ""}`}>
                    <p className={`font-["Roboto_Flex:Regular",sans-serif] font-normal relative shrink-0 text-[12px] ${isLight ? "" : "text-[#404040]"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      4 532
                    </p>
                    <p className={`font-["Roboto_Flex:Bold",sans-serif] font-bold relative shrink-0 text-[10px] ${isLight ? "" : "text-[#262626]"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      MGA
                    </p>
                  </div>
                </HeaderFreeUserHelper>
              </div>
            </div>
          </div>
          <Wrapper>
            <g id="Base" />
            <path d={svgPaths.p21e47ab0} id="Vector" stroke={isLight ? "var(--stroke-0, black)" : "var(--stroke-0, #292929)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </Wrapper>
          <div className="content-stretch flex gap-[14px] items-center relative shrink-0" data-name="User and Notifications">
            <Wrapper>
              <g id="Base" />
              <path d={svgPaths.p4a69b80} id="Vector 166" stroke={isLight ? "var(--stroke-0, black)" : "var(--stroke-0, #292929)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M11 22L13 22" id="Vector 77" stroke={isLight ? "var(--stroke-0, black)" : "var(--stroke-0, #292929)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <circle cx="12" cy="3" id="Ellipse 79" r="1" stroke={isLight ? "var(--stroke-0, black)" : "var(--stroke-0, #292929)"} strokeWidth="2" />
            </Wrapper>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
              <Wrapper>
                <g id="Base" />
                <path d={svgPaths.p3c874e00} id="Vector" stroke={isLight ? "var(--stroke-0, black)" : "var(--stroke-0, #292929)"} strokeWidth="2" />
                <path d={svgPaths.p11503a00} id="Vector_2" stroke={isLight ? "var(--stroke-4, black)" : "var(--stroke-4, #292929)"} strokeWidth="2" />
                <path d={svgPaths.p3417bd80} id="Vector_3" stroke={isLight ? "var(--stroke-0, black)" : "var(--stroke-0, #292929)"} strokeWidth="2" />
              </Wrapper>
              <div className="content-stretch flex items-center relative shrink-0">
                <p className={`font-["Roboto_Flex:Regular",sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[12px] ${isLight ? "text-black" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  Username
                </p>
              </div>
            </div>
            <div className="content-stretch flex items-center justify-center relative shrink-0">
              <Wrapper>
                <g id="Base" />
                <circle cx="12" cy="12" id="Ellipse 41" r="2" stroke={isLight ? "var(--stroke-0, black)" : "var(--stroke-0, #292929)"} strokeWidth="2" />
                <path d={svgPaths.pc6bb6f0} id="Vector" stroke={isLight ? "var(--stroke-0, black)" : "var(--stroke-0, #292929)"} strokeLinejoin="round" strokeWidth="2" />
              </Wrapper>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PetitesAnnonces() {
  return (
    <div className="bg-white relative size-full" data-name="Petites Annonces">
      <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[24px] items-center left-1/2 px-[32px] top-0 w-[1440px]" data-name="Main Frame">
        <div className="bg-[#27624f] h-[71px] relative shrink-0 w-[1440px]" data-name="Bandeau">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center pl-[32px] pr-[10px] py-[10px] relative size-full">
              <div className="content-stretch flex flex-[1_0_0] gap-[19px] items-center justify-center min-h-px min-w-px relative">
                <div className="relative shrink-0 size-[29.978px]" data-name="Union">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 29.9785 29.9785">
                    <path d={svgPaths.p3aad7d00} fill="var(--fill-0, white)" id="Union" />
                  </svg>
                </div>
                <Text1 text="Votre Pub ICI" additionalClassNames="text-[25.556px]" />
              </div>
            </div>
          </div>
        </div>
        <HeaderFreeUser className="min-w-[1220px] relative shrink-0 w-[1440px]" property1="light" />
        <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="Main Content">
          <div className="content-stretch flex flex-col gap-[24px] items-end relative shrink-0 w-full" data-name="Sponsored Section">
            <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-right uppercase w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
              <p className="leading-[normal] whitespace-pre-wrap">SponsorisÃƒÆ’Ã‚Â©s</p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Sponsorised">
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[14px] items-end justify-center min-h-px min-w-px relative" data-name="Sponsorised">
                <div className="content-stretch flex gap-[14px] items-center relative shrink-0" data-name="Contents">
                  <div className="flex flex-row items-center self-stretch">
                    <div className="bg-[#15181d] h-full relative rounded-[12px] shrink-0 w-[209px]" data-name="Cards sponsorised">
                      <div aria-hidden="true" className="absolute border-2 border-[#27624f] border-solid inset-0 pointer-events-none rounded-[12px]" />
                      <div className="flex flex-col items-center justify-end size-full">
                        <div className="content-stretch flex flex-col gap-[13.086px] items-center justify-end p-[2px] relative size-full">
                          <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[12px] w-full">
                            <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
                              <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgRectangle4848} />
                              <div className="absolute bg-gradient-to-b from-[50.251%] from-[rgba(21,24,29,0)] inset-0 rounded-[12px] to-[#15181d]" />
                            </div>
                          </div>
                          <div className="relative shrink-0 w-full">
                            <div className="content-stretch flex flex-col gap-[8px] items-start leading-[0] not-italic p-[10px] relative w-full">
                              <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold h-[35.332px] justify-center relative shrink-0 text-[24px] text-white w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                                <p className="leading-[16px] whitespace-pre-wrap">Petites Annonces</p>
                              </div>
                              <div className="flex flex-col font-['Roboto_Flex:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[#a3a3a3] text-[16px] w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                                <p className="leading-[normal] whitespace-pre-wrap">{`Achetez, vendez ou ÃƒÆ’Ã‚Â©changez facilement. `}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Wrapper2>
                    <ImagePetitesAnnoncesImage />
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#22c55e]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Samsung Galaxy S22" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="3 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </Wrapper2>
                  <Wrapper2>
                    <ImagePetitesAnnoncesImage1 />
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#fb923c]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Fender X760" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </Wrapper2>
                  <Wrapper2>
                    <Wrapper3>
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces3} />
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces4} />
                    </Wrapper3>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#27624f]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Oud of Dubai" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="1 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </Wrapper2>
                  <Wrapper2>
                    <ImagePetitesAnnoncesImage2 />
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#1d4ed8]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Phillips G40" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </Wrapper2>
                  <div className="flex flex-row items-center self-stretch">
                    <Ads className="bg-[#27624f] h-full relative rounded-[12px] shrink-0 w-[180px]" />
                  </div>
                  <div className="flex flex-row items-center self-stretch">
                    <Ads className="bg-[#27624f] h-full relative rounded-[12px] shrink-0 w-[180px]" />
                  </div>
                </div>
                <div className="relative shrink-0 w-[80px]" data-name="Pagination">
                  <div className="flex flex-row items-center size-full">
                    <div className="content-stretch flex items-center justify-between relative w-full">
                      <Wrapper>
                        <g id="Base" />
                        <path d="M14 7L9 12" id="Vector" stroke="var(--stroke-0, #A3A3A3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        <path d="M9 12L14 17" id="Vector_2" stroke="var(--stroke-0, #A3A3A3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </Wrapper>
                      <Wrapper>
                        <g id="Base" />
                        <path d="M10 17L15 12" id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        <path d="M15 12L10 7" id="Vector_2" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </Wrapper>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#dfdfdf] h-[220px] relative shrink-0 w-full" data-name="Ads 6">
            <div className="flex flex-col items-center size-full">
              <div className="content-stretch flex flex-col items-center relative size-full">
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[31px] justify-center leading-[0] not-italic relative shrink-0 text-[#727272] text-[9.1px] text-center tracking-[0.5px] uppercase w-full">
                  <p className="leading-[10px] whitespace-pre-wrap">PublicitÃƒÆ’Ã‚Â©</p>
                </div>
                <div className="bg-[#dfdfdf] relative shrink-0 w-full" data-name="Ads 5">
                  <div aria-hidden="true" className="absolute border-[#dfdfdf] border-b border-solid border-t inset-0 pointer-events-none" />
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
          <div className="bg-white content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Body">
            <div className="content-stretch flex items-start pt-[28px] relative shrink-0 w-full" data-name="Container">
              <div className="h-[746px] max-h-[815px] min-h-[582px] shrink-0 sticky top-0" data-name="Group - Job List Sidebar">
                <div className="content-stretch flex flex-col h-full items-start max-h-[inherit] min-h-[inherit] overflow-x-clip overflow-y-auto pr-px relative">
                  <div className="relative shrink-0 w-[216px]" data-name="Container">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative w-full">
                      <div className="relative shrink-0 w-[216px]" data-name="Container">
                        <div className="content-stretch flex flex-col items-start relative w-full">
                          <div className="relative shrink-0 w-full" data-name="HorizontalBorder">
                            <div className="content-stretch flex flex-col items-start pl-[10px] pr-[16px] py-[10px] relative w-full">
                              <HeadingButton>
                                <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Container">
                                  <Container text="Categories" additionalClassNames="leading-[normal]" />
                                </div>
                                <div className="flex items-center justify-center relative shrink-0">
                                  <div className="-scale-y-100 flex-none">
                                    <Wrapper1>
                                      <Wrapper4>
                                        <g clipPath="url(#clip0_4_2500)" id="SVG">
                                          <path d={svgPaths.p3d827500} fill="var(--fill-0, #474747)" id="Vector" />
                                        </g>
                                        <defs>
                                          <clipPath id="clip0_4_2500">
                                            <rect fill="white" height="10" width="10" />
                                          </clipPath>
                                        </defs>
                                      </Wrapper4>
                                    </Wrapper1>
                                  </div>
                                </div>
                              </HeadingButton>
                            </div>
                          </div>
                          <div className="relative shrink-0 w-full" data-name="HorizontalBorder">
                            <div aria-hidden="true" className="absolute border-[#e8e8e8] border-solid border-t inset-0 pointer-events-none" />
                            <div className="content-stretch flex flex-col items-start pb-[10px] pl-[10px] pr-[15px] pt-[11px] relative w-full">
                              <div className="relative shrink-0 w-full" data-name="Region">
                                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[14px] items-start overflow-x-clip overflow-y-auto py-[6px] relative w-full">
                                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-[264px]" data-name="Fieldset">
                                    <Label>
                                      <Text text="Tous" additionalClassNames="text-[#171717]" />
                                      <div className="absolute left-0 size-[16px] top-[2.49px]" data-name="Radio button checked">
                                        <div className="-translate-y-1/2 absolute bg-white border border-[#27624f] border-solid left-0 rounded-[16px] size-[16px] top-1/2" data-name="Background+Border" />
                                        <div className="absolute bg-[#27624f] left-[3px] rounded-[10px] size-[10px] top-[2.94px]" data-name="Background" />
                                      </div>
                                    </Label>
                                  </div>
                                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Content filter">
                                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
                                      <div className="content-stretch flex items-start pl-[25px] pt-[2px] relative shrink-0" data-name="Label">
                                        <Text text="Immobilier" additionalClassNames="text-[#171717]" />
                                        <RadioButton additionalClassNames="top-[calc(50%+0.5px)]" />
                                      </div>
                                    </div>
                                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
                                      <div className="content-stretch flex items-start pl-[25px] pt-[2px] relative shrink-0" data-name="Label">
                                        <Text text="Vacances" additionalClassNames="text-[#171717]" />
                                        <RadioButton additionalClassNames="top-[calc(50%+0.5px)]" />
                                      </div>
                                    </div>
                                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
                                      <div className="content-stretch flex items-start pl-[25px] pt-[2px] relative shrink-0" data-name="Label">
                                        <Text text="Mode" additionalClassNames="text-[#171717]" />
                                        <RadioButton additionalClassNames="top-[calc(50%+0.49px)]" />
                                      </div>
                                    </div>
                                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
                                      <div className="content-stretch flex items-start pl-[25px] pt-[2px] relative shrink-0" data-name="Label">
                                        <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#171717] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                                          <p className="leading-[normal]">{`Maison & Jardin`}</p>
                                        </div>
                                        <RadioButton additionalClassNames="top-[calc(50%+0.49px)]" />
                                      </div>
                                    </div>
                                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
                                      <Label>
                                        <Text4 text="ÃƒÆ’Ã¢â‚¬Â°lectronique" additionalClassNames="text-[#171717] text-[12px]" />
                                        <RadioButton additionalClassNames="top-[calc(50%+0.49px)]" />
                                      </Label>
                                    </div>
                                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
                                      <div className="content-stretch flex items-start pl-[25px] pt-[2px] relative shrink-0" data-name="Label">
                                        <Text text="Loisirs" additionalClassNames="text-[#171717]" />
                                        <RadioButton additionalClassNames="top-[calc(50%+0.49px)]" />
                                      </div>
                                    </div>
                                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
                                      <div className="content-stretch flex items-start pl-[25px] pt-[2px] relative shrink-0" data-name="Label">
                                        <Text text="VÃƒÆ’Ã‚Â©hicules" additionalClassNames="text-[#171717]" />
                                        <RadioButton additionalClassNames="top-[calc(50%+0.5px)]" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="content-stretch flex h-[28px] items-center justify-center relative shrink-0" data-name="Button">
                                    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
                                      <Text text="Voir plus" additionalClassNames="text-[#27624f] text-center" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <HorizontalBorder>
                            <HeadingButton>
                              <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Container">
                                <Container text="Type" additionalClassNames="leading-[normal]" />
                              </div>
                              <Container1 />
                            </HeadingButton>
                          </HorizontalBorder>
                          <HorizontalBorder>
                            <HeadingButton>
                              <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Container">
                                <Container text="Location" additionalClassNames="leading-[normal]" />
                              </div>
                              <Container1 />
                            </HeadingButton>
                          </HorizontalBorder>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div aria-hidden="true" className="absolute border-[#e8e8e8] border-r border-solid inset-0 pointer-events-none" />
              </div>
              <div className="content-stretch flex flex-col gap-[24px] items-start pl-[14px] relative self-stretch shrink-0 w-[1160px]" data-name="Section - Search results">
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-[710px]" data-name="Container">
                    <div className="content-stretch flex flex-col items-start pb-[0.8px] relative shrink-0 w-full" data-name="Heading">
                      <div className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#191919] text-[0px] w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                        <p className="text-[12px] whitespace-pre-wrap">
                          <HeadingHelper additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold">{`RÃƒÆ’Ã¢â‚¬Â°SULTATS `}</HeadingHelper>
                          <HeadingHelper additionalClassNames="font-['Roboto_Flex:Regular',sans-serif] font-normal">(1014)</HeadingHelper>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex h-[38px] items-start max-w-[350px] p-px relative rounded-[50px] shrink-0 w-[350px]" data-name="Background+Border">
                    <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[50px]" />
                    <div className="h-[36px] relative shrink-0 w-[40px]" data-name="Container">
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pb-[9.5px] pl-[15px] pr-[7px] pt-[8.5px] relative size-full">
                        <div className="opacity-70 overflow-clip relative shrink-0 size-[18px]" data-name="Graphics-symbol img">
                          <div className="absolute inset-[11.22%_1.22%_0.98%_11.29%]" data-name="Group">
                            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.7486 15.8049">
                              <g id="Group">
                                <path d={svgPaths.p1b8556c0} fill="var(--fill-0, #707070)" id="Vector" />
                                <path d={svgPaths.p17aa0000} fill="var(--fill-0, #707070)" id="Vector_2" />
                              </g>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-[1_0_0] h-[36px] min-h-px min-w-px relative" data-name="Form:margin">
                      <div className="flex flex-col justify-center size-full">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start justify-center pr-[10px] relative size-full">
                          <div className="flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="Form">
                            <div className="absolute left-0 overflow-clip size-px top-0" data-name="Container">
                              <div className="-translate-y-1/2 absolute flex flex-col font-['Acumin_Pro:Regular',sans-serif] h-[16px] justify-center leading-[0] left-0 not-italic text-[#191919] text-[12px] top-[7.5px] w-[37.674px]">
                                <p className="leading-[15.6px] whitespace-pre-wrap">Search</p>
                              </div>
                            </div>
                            <div className="absolute h-[36px] left-0 overflow-clip top-0 w-[298px]" data-name="Input - Search Jobs">
                              <div className="absolute content-stretch flex flex-col items-start left-0 overflow-clip right-0 top-[9px]" data-name="Container">
                                <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#707070] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                                  <p className="leading-[14px]">Recherche</p>
                                </div>
                              </div>
                              <div className="absolute content-stretch flex items-center justify-center left-0 right-0 top-[9px]" data-name="Container">
                                <div className="flex-[1_0_0] h-[18px] min-h-px min-w-px" data-name="Container" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-start flex flex-wrap gap-[12px] items-start relative shrink-0 w-[1146px]" data-name="Job List Feed ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Job List Feed">
                  <CardsAo>
                    <ImagePetitesAnnoncesImage />
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#22c55e]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <ImagePetitesAnnoncesImage1 />
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#fb923c]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <ImagePetitesAnnoncesImage3 />
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#27624f]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <ImagePetitesAnnoncesImage2 />
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#1d4ed8]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <ImagePetitesAnnoncesImage3 />
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-black" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <Wrapper3>
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces} />
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces6} />
                    </Wrapper3>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#22c55e]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <Wrapper3>
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces} />
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces7} />
                    </Wrapper3>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#1d4ed8]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <Wrapper3>
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces} />
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces8} />
                    </Wrapper3>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-black" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <Wrapper3>
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces} />
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces9} />
                    </Wrapper3>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#22c55e]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <ImagePetitesAnnoncesImage4>
                      <img alt="" className="absolute h-[157.82%] left-0 max-w-none top-[-47.35%] w-full" src={imgImagePetitesAnnonces10} />
                    </ImagePetitesAnnoncesImage4>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#27624f]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <Wrapper3>
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces} />
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces11} />
                    </Wrapper3>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-black" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <ImagePetitesAnnoncesImage3 />
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#fb923c]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <Wrapper3>
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces} />
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces12} />
                    </Wrapper3>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-black" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <ImagePetitesAnnoncesImage3 />
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#27624f]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <Wrapper3>
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces} />
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces13} />
                    </Wrapper3>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#1d4ed8]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <ImagePetitesAnnoncesImage4>
                      <img alt="" className="absolute h-[189.09%] left-0 max-w-none top-[-19.19%] w-full" src={imgImagePetitesAnnonces14} />
                    </ImagePetitesAnnoncesImage4>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-black" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <Wrapper3>
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces} />
                      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces15} />
                    </Wrapper3>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#22c55e]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                  <CardsAo>
                    <ImagePetitesAnnoncesImage3 />
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="P" additionalClassNames="bg-[#27624f]" />
                        <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                          <ContainerText text="Perrichet" />
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                        <Text3 text="Danelectro de 1996 + ÃƒÆ’Ã‚Â©tui original" additionalClassNames="font-['Roboto_Flex:SemiBold',sans-serif] font-semibold text-[12px]" />
                        <Wrapper5 text="6 000 000 Ar" additionalClassNames="leading-[14px] whitespace-pre-wrap" />
                        <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                          <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                            <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                              <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                <Group />
                              </div>
                            </div>
                          </div>
                          <Text5 text="Ivato" />
                        </div>
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text4 text="13 days ago" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsAo>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-[156px] relative shrink-0 w-full" data-name="Nav Footer">
          <div aria-hidden="true" className="absolute border-[#f2f2f2] border-solid border-t inset-0 pointer-events-none" />
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center justify-between px-[32px] relative size-full">
              <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="List ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Item">
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#0a0a0a] text-[9.6px] text-center whitespace-nowrap">
                  <p className="leading-[11px]">Ãƒâ€šÃ‚Â©Ãƒâ€šÃ‚Â 2026Ãƒâ€šÃ‚Â 24/24 MG</p>
                </div>
              </div>
              <div className="content-stretch flex font-['Inter:Regular',sans-serif] font-normal gap-[20px] items-start justify-center leading-[0] not-italic px-[10px] py-[0.5px] relative shrink-0 text-[#0a0a0a] text-center whitespace-nowrap" data-name="List">
                <div className="flex flex-col justify-center relative shrink-0 text-[9.3px]">
                  <p className="leading-[20px]">Lorem</p>
                </div>
                <div className="flex flex-col justify-center relative shrink-0 text-[9.6px]">
                  <p className="leading-[20px]">Privacy Policy</p>
                </div>
                <div className="flex flex-col justify-center relative shrink-0 text-[9.6px]">
                  <p className="leading-[20px]">Cookie Policy</p>
                </div>
                <div className="flex flex-col justify-center relative shrink-0 text-[9.6px]">
                  <p className="leading-[20px]">Terms of Service</p>
                </div>
                <div className="flex flex-col justify-center relative shrink-0 text-[9.6px]">
                  <p className="leading-[20px]">Terms of Sale</p>
                </div>
                <div className="flex flex-col justify-center relative shrink-0 text-[9.8px]">
                  <p className="leading-[20px]">Help</p>
                </div>
                <div className="flex flex-col justify-center relative shrink-0 text-[9.8px]">
                  <p className="leading-[20px]">Subscriptions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
