// @ts-nocheck
"use client";

// @ts-nocheck
import clsx from "clsx";
import svgPaths from "./svg-h6eue3h5ci";
const imgAds3 = "/prototype-assets/0c81bdc5da5af2c126817a91e92fcc5d963eb4c6.png";
const imgAds02 = "/prototype-assets/5b10018d9d1c3cba1693af46cf071bfb676ebdee.png";
const imgAds4 = "/prototype-assets/f7f85b12cbfa7c7b47238d957537b7e5b33be8e5.png";
const imgRectangle4848 = "/prototype-assets/dfc3624f268495edc493c7c6df1be9f622e5809c.png";
const imgRectangle4849 = "/prototype-assets/c37bad47617250953d4216bea025f6c881ea1839.png";

function CardsJob({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-white h-[216px] relative rounded-[6px] shrink-0 w-[180px]">
      <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="content-stretch flex flex-col items-start justify-between p-[15px] relative size-full">{children}</div>
    </div>
  );
}

function CardsParent({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[182px] relative shrink-0 w-full">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[20px] items-start relative size-full">{children}</div>
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

function Container({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start pl-[25px] pt-[2px] relative shrink-0" data-name="Label">
        {children}
      </div>
    </div>
  );
}
type Wrapper2Props = {
  additionalClassNames?: string;
};

function Wrapper2({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper2Props>) {
  return (
    <div className={clsx("content-stretch flex flex-col items-start relative shrink-0", additionalClassNames)}>
      <div className="relative shrink-0 w-full" data-name="Label">
        <div className="content-stretch flex items-start pl-[25px] pt-[2px] relative w-full">{children}</div>
      </div>
    </div>
  );
}
type Wrapper1Props = {
  additionalClassNames?: string;
};

function Wrapper1({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper1Props>) {
  return (
    <div className={clsx("content-stretch flex flex-col items-start pl-[10px] pr-[16px] relative w-full", additionalClassNames)}>
      <div className="h-[32px] relative shrink-0 w-full" data-name="Heading ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Button">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5px] items-center relative size-full">{children}</div>
      </div>
    </div>
  );
}

function PaginationHelper({ children }: React.PropsWithChildren<{}>) {
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

function HorizontalBorder({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#e8e8e8] border-solid border-t inset-0 pointer-events-none" />
      <Wrapper1 additionalClassNames="pb-[10px] pt-[11px]">{children}</Wrapper1>
    </div>
  );
}
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return (
    <div className={clsx("content-stretch flex flex-col h-[11px] items-start pt-px relative w-[10px]", additionalClassNames)}>
      <div className="flex items-center justify-center relative shrink-0 size-[10px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "153.625" } as React.CSSProperties}>
        <div className="flex-none rotate-90">
          <div className="relative size-[10px]" data-name="SVG">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
              {children}
            </svg>
          </div>
        </div>
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
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("flex flex-[1_0_0] flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] min-h-px min-w-px not-italic relative", additionalClassNames)}>
      <p className="leading-[normal] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type TexteProps = {
  text: string;
  text1: string;
};

function Texte({ text, text1 }: TexteProps) {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start leading-[0] not-italic relative shrink-0 text-[12px] w-full">
      <div className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center relative shrink-0 text-[#0a0a0a] w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        <p className="leading-[normal] whitespace-pre-wrap">{text}</p>
      </div>
      <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center overflow-hidden relative shrink-0 text-[#737373] text-ellipsis w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        <p className="leading-[14px] whitespace-pre-wrap">{text1}</p>
      </div>
    </div>
  );
}

function Union() {
  return (
    <div className="relative shrink-0 size-[15px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
        <path d={svgPaths.p1d0f4800} fill="var(--fill-0, #27624f)" id="Union" />
      </svg>
    </div>
  );
}
type HelperProps = {
  additionalClassNames?: string;
};

function Helper({ additionalClassNames = "" }: HelperProps) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#737373] text-[0px] whitespace-nowrap">
      <Text text="Ivato" additionalClassNames="font-['Roboto_Flex:Regular',sans-serif] font-normal" />
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

function ContainerContainer() {
  return (
    <Wrapper additionalClassNames="shrink-0">
      <g clipPath="url(#clip0_4_2497)" id="SVG">
        <path d={svgPaths.p9344b80} fill="var(--fill-0, #474747)" id="Vector" />
      </g>
      <defs>
        <clipPath id="clip0_4_2497">
          <rect fill="white" height="10" width="10" />
        </clipPath>
      </defs>
    </Wrapper>
  );
}
type Text2Props = {
  text: string;
};

function Text2({ text }: Text2Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] w-full">
      <p className="leading-[normal] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type ContainerRadioButtonProps = {
  additionalClassNames?: string;
};

function ContainerRadioButton({ additionalClassNames = "" }: ContainerRadioButtonProps) {
  return (
    <div className={clsx("-translate-y-1/2 absolute bg-white left-0 rounded-[16px] size-[16px]", additionalClassNames)}>
      <div aria-hidden="true" className="absolute border border-[#a3a3a3] border-solid inset-0 pointer-events-none rounded-[16px]" />
    </div>
  );
}
type Text1Props = {
  text: string;
  additionalClassNames?: string;
};

function Text1({ text, additionalClassNames = "" }: Text1Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] whitespace-nowrap", additionalClassNames)}>
      <p className="leading-[normal]">{text}</p>
    </div>
  );
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <p style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("leading-[normal] text-[12px]", additionalClassNames)}>
      {text}
    </p>
  );
}
type ContainerContainerTextProps = {
  text: string;
};

function ContainerContainerText({ text }: ContainerContainerTextProps) {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
      <div className="content-stretch flex items-start relative shrink-0" data-name="Container">
        <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#191919] text-[0px] whitespace-nowrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
          <Text text={text} additionalClassNames="font-['Roboto_Flex:Bold',sans-serif] font-bold" />
        </div>
      </div>
    </div>
  );
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
            <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[19.487px] text-white uppercase whitespace-nowrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
              <p className="leading-[normal]">Votre Pub ICI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Job() {
  return (
    <div className="bg-white relative size-full" data-name="JOB">
      <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center left-1/2 px-[32px] top-0 w-[1440px]" data-name="Main Frame">
        <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="Main Content">
          <div className="content-stretch flex flex-col gap-[24px] items-end relative shrink-0 w-[1376px]" data-name="Sponsored Section">
            <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-black text-right uppercase w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
              <p className="leading-[normal] whitespace-pre-wrap">SponsorisÃƒÆ’Ã‚Â©s</p>
            </div>
            <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Sponsorised">
              <div className="content-stretch flex flex-[1_0_0] flex-col gap-[14px] items-end justify-center min-h-px min-w-px relative" data-name="Sponsorised">
                <div className="content-stretch flex gap-[14px] h-[216px] items-center relative shrink-0 w-[1373px]" data-name="Contents">
                  <div className="bg-[#15181d] flex-[1_0_0] h-[216px] min-h-px min-w-px relative rounded-[12px]" data-name="Cards sponsorised">
                    <div aria-hidden="true" className="absolute border-2 border-[#27624f] border-solid inset-0 pointer-events-none rounded-[12px]" />
                    <div className="flex flex-col items-center justify-end size-full">
                      <div className="content-stretch flex flex-col gap-[13.086px] items-center justify-end p-[2px] relative size-full">
                        <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[12px] w-full">
                          <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
                            <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgRectangle4848} />
                            <div className="absolute inset-0 overflow-hidden rounded-[12px]">
                              <img alt="" className="absolute h-[183.13%] left-[-23.44%] max-w-none top-[-46.58%] w-[146.87%]" src={imgRectangle4849} />
                            </div>
                            <div className="absolute bg-gradient-to-b from-[50.251%] from-[rgba(21,24,29,0)] inset-0 rounded-[12px] to-[#15181d]" />
                          </div>
                        </div>
                        <div className="relative shrink-0 w-full">
                          <div className="content-stretch flex flex-col gap-[8px] items-start leading-[0] not-italic p-[10px] relative w-full">
                            <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold h-[35.332px] justify-center relative shrink-0 text-[24px] text-white w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                              <p className="leading-[16px] whitespace-pre-wrap">Appels dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢offre</p>
                            </div>
                            <div className="flex flex-col font-['Roboto_Flex:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[#a3a3a3] text-[16px] w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                              <p className="leading-[normal] whitespace-pre-wrap">Trouvez le poste qui correspond ÃƒÆ’Ã‚Â  vos ambitions.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-[#fb923c]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Karts Company" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                        <Union />
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Responsable marketing" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="G" additionalClassNames="bg-[#22c55e]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Gear Games" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                        <Union />
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Assistant de Direction" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-black" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Karts Company" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                        <Union />
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Responsable RH" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-[#27624f]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Karts Company" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                        <Union />
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Comptable" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <Ads className="bg-[#27624f] h-[214px] relative rounded-[12px] shrink-0 w-[180px]" />
                  <Ads className="bg-[#27624f] h-[214px] relative rounded-[12px] shrink-0 w-[180px]" />
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
          <div className="bg-white content-stretch flex flex-col h-[774px] items-start relative shrink-0 w-full" data-name="Body">
            <div className="content-stretch flex items-start pt-[28px] relative shrink-0 w-full" data-name="Container">
              <div className="h-[746px] max-h-[815px] min-h-[582px] shrink-0 sticky top-0" data-name="Group - Job List Sidebar">
                <div className="content-stretch flex flex-col h-full items-start max-h-[inherit] min-h-[inherit] overflow-x-clip overflow-y-auto pr-px relative">
                  <div className="relative shrink-0 w-[216px]" data-name="Container">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative w-full">
                      <div className="relative shrink-0 w-[216px]" data-name="Container">
                        <div className="content-stretch flex flex-col items-start relative w-full">
                          <div className="relative shrink-0 w-full" data-name="HorizontalBorder">
                            <Wrapper1 additionalClassNames="py-[10px]">
                              <ContainerContainerText text="Categories" />
                              <div className="flex items-center justify-center relative shrink-0">
                                <div className="-scale-y-100 flex-none">
                                  <Wrapper>
                                    <g clipPath="url(#clip0_4_2500)" id="SVG">
                                      <path d={svgPaths.p3d827500} fill="var(--fill-0, #474747)" id="Vector" />
                                    </g>
                                    <defs>
                                      <clipPath id="clip0_4_2500">
                                        <rect fill="white" height="10" width="10" />
                                      </clipPath>
                                    </defs>
                                  </Wrapper>
                                </div>
                              </div>
                            </Wrapper1>
                          </div>
                          <div className="relative shrink-0 w-full" data-name="HorizontalBorder">
                            <div aria-hidden="true" className="absolute border-[#e8e8e8] border-solid border-t inset-0 pointer-events-none" />
                            <div className="content-stretch flex flex-col items-start pb-[10px] pl-[10px] pr-[15px] pt-[11px] relative w-full">
                              <div className="relative shrink-0 w-full" data-name="Region">
                                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[14px] items-start overflow-x-clip overflow-y-auto py-[6px] relative w-full">
                                  <Wrapper2 additionalClassNames="w-[264px]">
                                    <Text1 text="Tous" additionalClassNames="text-[#171717]" />
                                    <div className="absolute left-0 size-[16px] top-[2.49px]" data-name="Radio button checked">
                                      <div className="-translate-y-1/2 absolute bg-white border border-[#27624f] border-solid left-0 rounded-[16px] size-[16px] top-1/2" data-name="Background+Border" />
                                      <div className="absolute bg-[#27624f] left-[3px] rounded-[10px] size-[10px] top-[2.94px]" data-name="Background" />
                                    </div>
                                  </Wrapper2>
                                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Content filter">
                                    <Container>
                                      <Text1 text="Responsable RH" additionalClassNames="text-[#171717]" />
                                      <ContainerRadioButton additionalClassNames="top-[calc(50%+0.5px)]" />
                                    </Container>
                                    <Container>
                                      <Text1 text="Assistant de Direction" additionalClassNames="text-[#171717]" />
                                      <ContainerRadioButton additionalClassNames="top-[calc(50%+0.5px)]" />
                                    </Container>
                                    <Container>
                                      <Text1 text="Commercial B2B" additionalClassNames="text-[#171717]" />
                                      <ContainerRadioButton additionalClassNames="top-[calc(50%+0.49px)]" />
                                    </Container>
                                    <Container>
                                      <Text1 text="Responsable marketing" additionalClassNames="text-[#171717]" />
                                      <ContainerRadioButton additionalClassNames="top-[calc(50%+0.49px)]" />
                                    </Container>
                                    <Wrapper2 additionalClassNames="w-full">
                                      <Text3 text="Technicien Support Informatique" additionalClassNames="text-[#171717] text-[12px]" />
                                      <ContainerRadioButton additionalClassNames="top-[calc(50%+0.49px)]" />
                                    </Wrapper2>
                                    <Container>
                                      <Text1 text="RÃƒÆ’Ã‚Â©dacteur Web" additionalClassNames="text-[#171717]" />
                                      <ContainerRadioButton additionalClassNames="top-[calc(50%+0.49px)]" />
                                    </Container>
                                    <Container>
                                      <Text1 text="ModÃƒÆ’Ã‚Â©rateur de contenu" additionalClassNames="text-[#171717]" />
                                      <ContainerRadioButton additionalClassNames="top-[calc(50%+0.5px)]" />
                                    </Container>
                                    <Container>
                                      <Text1 text="Gestionnaire de stock" additionalClassNames="text-[#171717]" />
                                      <ContainerRadioButton additionalClassNames="top-[calc(50%+0.5px)]" />
                                    </Container>
                                    <Container>
                                      <Text1 text="TÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©conseiller francophone" additionalClassNames="text-[#171717]" />
                                      <ContainerRadioButton additionalClassNames="top-[calc(50%+0.5px)]" />
                                    </Container>
                                  </div>
                                  <div className="content-stretch flex h-[28px] items-center justify-center relative shrink-0" data-name="Button">
                                    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
                                      <Text1 text="Voir plus" additionalClassNames="text-[#27624f] text-center" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <HorizontalBorder>
                            <ContainerContainerText text="Type" />
                            <ContainerContainer />
                          </HorizontalBorder>
                          <HorizontalBorder>
                            <ContainerContainerText text="Location" />
                            <ContainerContainer />
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
                          <span className="leading-[normal]">{`RÃƒÆ’Ã¢â‚¬Â°SULTATS `}</span>
                          <span className="font-['Roboto_Flex:Regular',sans-serif] font-normal leading-[normal] not-italic" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                            (1014)
                          </span>
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
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="A" additionalClassNames="bg-[#27624f]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="AX Company" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Graphiste" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="G" additionalClassNames="bg-[#22c55e]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Cloudaris" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                        <Union />
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Assistant de Direction" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-black" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Synaptech" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="UX Designer" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-[#fb923c]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Valyance" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="ChargÃƒÆ’Ã‚Â©(e) de recrutement" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-[#1d4ed8]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Datacore Innovations" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Assistant de Direction" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-[#27624f]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Novaris International" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="RÃƒÆ’Ã‚Â©dacteur Web" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-[#fb923c]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Nexoria Group" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                        <Union />
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Responsable marketing" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-[#1d4ed8]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="BÃƒÆ’Ã‚Â¢tinova" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Responsable marketing" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-[#27624f]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Urbanex Construction" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Assistant de Direction" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-black" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Voltaris" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                        <Union />
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Responsable RH" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-[#22c55e]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Solutec Industrie" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Assistant de Direction" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-[#a21caf]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="DigisphÃƒÆ’Ã‚Â¨re" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Technicien Support Informatique" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-[#1d4ed8]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Virtuaxis" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="ModÃƒÆ’Ã‚Â©rateur de contenu" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-[#27624f]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="StratÃƒÆ’Ã‚Â©on Consulting" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                        <Union />
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Journaliste" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-black" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="InovaTech Labs" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Community Manager" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-[#fb923c]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Construlys" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Assistant de Direction" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-[#27624f]" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Greenova Energy" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                        <Union />
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Comptable" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                  <CardsJob>
                    <CardsParent>
                      <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full" data-name="Profile">
                        <LogoText text="K" additionalClassNames="bg-black" />
                        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start min-h-px min-w-px relative" data-name="Name/location">
                          <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-full" data-name="Container">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                              <Text2 text="Techniforge" />
                            </div>
                          </div>
                          <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
                            <div className="h-[12px] relative shrink-0 w-[13px]" data-name="SVG:margin">
                              <div className="absolute content-stretch flex flex-col h-[13px] items-start justify-center left-0 overflow-clip top-[-1px] w-[8px]" data-name="SVG">
                                <div className="flex-[1_0_0] min-h-px min-w-px overflow-clip relative w-[8px]" data-name="Frame">
                                  <Group />
                                </div>
                              </div>
                            </div>
                            <Helper />
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col h-[126px] items-start justify-between relative shrink-0 w-full" data-name="Blog texte">
                        <Texte text="Commercial B2B" text1="Description it amet consectetur. Eu porttitor consequat blandit nulla. Egestas vitae in accumsan tellus lorem mauris turpis semper. Sit id nulla placerat suspendisse vitae eget. Erat sagittis aliquam volutpat nascetur et a." />
                        <div className="content-stretch flex h-[18px] items-center relative shrink-0 w-full" data-name="Container">
                          <Time>
                            <div className="content-stretch flex items-start max-w-[120px] overflow-clip relative shrink-0 w-full" data-name="Container">
                              <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" additionalClassNames="text-[#737373] text-[10px]" />
                            </div>
                          </Time>
                        </div>
                      </div>
                    </CardsParent>
                  </CardsJob>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
