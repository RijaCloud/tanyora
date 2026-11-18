// @ts-nocheck
"use client";

// @ts-nocheck
import clsx from "clsx";
import svgPaths from "./svg-m6twf3uopm";

function Wrapper11({ children }: React.PropsWithChildren<{}>) {
  return (
    <p style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex-[1_0_0] font-['Roboto_Flex:Regular',sans-serif] font-normal leading-[0] min-h-px min-w-px not-italic relative text-[#364153] text-[0px] text-[12px] whitespace-pre-wrap">
      {children}
    </p>
  );
}

function Container2({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-white flex-[1_0_0] h-full min-h-px min-w-px relative rounded-[12px]">
      <div aria-hidden="true" className="absolute border-[#f2f2f2] border-[0.939px] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_0.939px_2.816px_0px_rgba(0,0,0,0.1),0px_0.939px_1.877px_0px_rgba(0,0,0,0.1)]" />
      <div className="content-stretch flex flex-col items-start p-[14px] relative size-full">{children}</div>
    </div>
  );
}

function Wrapper10({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full">
      <p className="flex-[1_0_0] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18.774px] min-h-px min-w-px not-italic relative text-[#101828] text-[13.142px] whitespace-pre-wrap">{children}</p>
    </div>
  );
}

function Wrapper9({ children }: React.PropsWithChildren<{}>) {
  return (
    <Wrapper11>
      <span className="leading-[14px]">{children}</span>
      <Text7 text="Unlimited" />
    </Wrapper11>
  );
}

function Wrapper6({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="content-stretch flex items-start relative shrink-0">
      <Wrapper11>{children}</Wrapper11>
    </div>
  );
}

function Wrapper8({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="content-stretch flex flex-[1_0_0] h-[19.15px] items-start min-h-px min-w-px relative">
      <Wrapper11>{children}</Wrapper11>
    </div>
  );
}
type Wrapper7Props = {
  additionalClassNames?: string;
};

function Wrapper7({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper7Props>) {
  return (
    <div className={additionalClassNames}>
      <Wrapper9>{children}</Wrapper9>
    </div>
  );
}

function Text11({ children }: React.PropsWithChildren<{}>) {
  return (
    <Wrapper8>
      <span className="leading-[14px]">{children}</span>
      <Text7 text="20" />
    </Wrapper8>
  );
}
type Text10Props = {
  additionalClassNames?: string;
};

function Text10({ children, additionalClassNames = "" }: React.PropsWithChildren<Text10Props>) {
  return (
    <Wrapper6 additionalClassNames={additionalClassNames}>
      <span className="leading-[14px]">{children}</span>
      <Text7 text="10" />
    </Wrapper6>
  );
}

function Text9({ children }: React.PropsWithChildren<{}>) {
  return (
    <Wrapper6 additionalClassNames="h-[18.774px] w-[175.35px]">
      <span className="leading-[14px]">
        <span className="leading-[14px]">{children}</span>
        <Text7 text="30" />
      </span>
      <Text7 text="30" />
    </Wrapper6>
  );
}

function Text8({ children }: React.PropsWithChildren<{}>) {
  return (
    <Wrapper6 additionalClassNames="h-[18.774px] w-[175.35px]">
      <span className="leading-[14px]">
        <span className="leading-[14px]">{children}</span>
        <Text7 text="1" />
      </span>
      <Text7 text="1" />
    </Wrapper6>
  );
}

function Wrapper5({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[15.02px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.0196 15.0196">
        <g id="Icon">{children}</g>
      </svg>
    </div>
  );
}

function Wrapper4({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[15.32px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.32 15.32">
        <g id="Icon">{children}</g>
      </svg>
    </div>
  );
}

function Wrapper3({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[15.32px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.32 15.3199">
        <g id="Icon">{children}</g>
      </svg>
    </div>
  );
}
type Wrapper2Props = {
  additionalClassNames?: string;
};

function Wrapper2({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper2Props>) {
  return <Wrapper7 additionalClassNames={clsx("content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative", additionalClassNames)}>{children}</Wrapper7>;
}

function Wrapper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <Wrapper6 additionalClassNames="h-[18.774px] w-[175.35px]">
      <span className="leading-[14px]">
        <span className="leading-[14px]">{children}</span>
        <Text7 text="5" />
      </span>
      <Text7 text="5" />
    </Wrapper6>
  );
}
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return (
    <div className={clsx("h-[40px] relative rounded-[6px] shrink-0 w-full", additionalClassNames)}>
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[10px] items-center justify-center px-[20px] py-[10px] relative size-full">
          <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[0px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ButtonPrimary({ children }: React.PropsWithChildren<{}>) {
  return (
    <Wrapper additionalClassNames="bg-black">
      <p className="font-['Roboto_Flex:Bold',sans-serif] font-bold leading-[14px] text-[12px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {children}
      </p>
    </Wrapper>
  );
}

function Text3() {
  return <Wrapper1>{`Mise en avant annonces: `}</Wrapper1>;
}

function Helper() {
  return <Wrapper9>{`Achat: `}</Wrapper9>;
}
type Text2Props = {
  additionalClassNames?: string;
};

function Text2({ additionalClassNames = "" }: Text2Props) {
  return (
    <div className={clsx("content-stretch flex h-[19.15px] items-start relative", additionalClassNames)}>
      <Wrapper11>
        <span className="leading-[14px]">{`Mise en avant annonces: `}</span>
        <Text7 text="3" />
      </Wrapper11>
    </div>
  );
}

function Text1() {
  return <Wrapper2>{`Candidatures / Mois: `}</Wrapper2>;
}

function Icon7() {
  return (
    <Wrapper3>
      <path d={svgPaths.p3cd3bc80} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.27666" />
    </Wrapper3>
  );
}

function Icon6() {
  return (
    <Wrapper4>
      <path d={svgPaths.pa472800} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.27666" />
    </Wrapper4>
  );
}
type TextProps = {
  additionalClassNames?: string;
};

function Text({ additionalClassNames = "" }: TextProps) {
  return <Wrapper7 additionalClassNames={clsx("content-stretch flex items-start relative shrink-0", additionalClassNames)}>{`Full Article: `}</Wrapper7>;
}

function Icon5() {
  return (
    <Wrapper4>
      <path d={svgPaths.p16767600} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.27666" />
    </Wrapper4>
  );
}

function Icon4() {
  return (
    <Wrapper5>
      <path d={svgPaths.p21523780} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25163" />
    </Wrapper5>
  );
}

function Icon3() {
  return (
    <Wrapper5>
      <path d={svgPaths.p3cc2fe70} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25163" />
    </Wrapper5>
  );
}

function Icon2() {
  return (
    <Wrapper5>
      <path d={svgPaths.p3665aa00} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25163" />
    </Wrapper5>
  );
}
type PriceText1Props = {
  text: string;
};

function PriceText1({ text }: PriceText1Props) {
  return (
    <div className="content-stretch flex gap-[4px] items-center not-italic relative shrink-0 w-full">
      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[37.549px] relative shrink-0 text-[#101828] text-[33.794px]">{text}</p>
      <Unites />
    </div>
  );
}

function Icon1() {
  return (
    <Wrapper5>
      <path d={svgPaths.p1fba6b00} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25163" />
    </Wrapper5>
  );
}
type HeadingProps = {
  additionalClassNames?: string;
};

function Heading({ additionalClassNames = "" }: HeadingProps) {
  return <Wrapper10 additionalClassNames={additionalClassNames}>{`Appel d'Offre`}</Wrapper10>;
}

function Icon() {
  return (
    <Wrapper5>
      <path d={svgPaths.p398df5e0} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25163" />
    </Wrapper5>
  );
}
type Text7Props = {
  text: string;
};

function Text7({ text }: Text7Props) {
  return (
    <span style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="font-['Roboto_Flex:Bold',sans-serif] font-bold leading-[14px] text-[#101828]">
      {text}
    </span>
  );
}
type Text6Props = {
  text: string;
};

function Text6({ text }: Text6Props) {
  return (
    <Wrapper11>
      <span className="leading-[14px]">{`Consultation AperÃƒÆ’Ã‚Â§u: `}</span>
      <Text7 text={text} />
    </Wrapper11>
  );
}
type TextTextProps = {
  text: string;
};

function TextText({ text }: TextTextProps) {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative">
      <p className="font-['Roboto_Flex:Regular',sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#364153] text-[0px] text-[12px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        <span className="leading-[14px]">{`Consultation AperÃƒÆ’Ã‚Â§u: `}</span>
        <Text7 text={text} />
      </p>
    </div>
  );
}
type HeadingText1Props = {
  text: string;
  additionalClassNames?: string;
};

function HeadingText1({ text, additionalClassNames = "" }: HeadingText1Props) {
  return <Wrapper10 additionalClassNames={additionalClassNames}>{text}</Wrapper10>;
}
type Container1Props = {
  additionalClassNames?: string;
};

function Container1({ additionalClassNames = "" }: Container1Props) {
  return (
    <div className={clsx("relative shrink-0", additionalClassNames)}>
      <div aria-hidden="true" className="absolute border-[#f2f2f2] border-solid border-t-[0.939px] inset-0 pointer-events-none" />
    </div>
  );
}
type PriceTextProps = {
  text: string;
};

function PriceText({ text }: PriceTextProps) {
  return (
    <div className="content-stretch flex gap-[4px] items-center not-italic relative shrink-0 w-full">
      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[37.549px] relative shrink-0 text-[#101828] text-[34px]">{text}</p>
      <Unites />
    </div>
  );
}
type UnitesProps = {
  additionalClassNames?: string;
};

function Unites({ additionalClassNames = "" }: UnitesProps) {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal items-start leading-[14px] min-h-px min-w-px relative text-[12px]">
      <Text4 text="/ month" additionalClassNames="text-[#6a7282]" />
      <Text4 text="Ar" additionalClassNames="text-[#4a5565]" />
    </div>
  );
}
type Text5Props = {
  text: string;
};

function Text5({ text }: Text5Props) {
  return (
    <p style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="font-['Roboto_Flex:Bold',sans-serif] font-bold leading-[14px] text-[12px]">
      {text}
    </p>
  );
}
type Text4Props = {
  text: string;
  additionalClassNames?: string;
};

function Text4({ text, additionalClassNames = "" }: Text4Props) {
  return (
    <p style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("relative shrink-0", additionalClassNames)}>
      {text}
    </p>
  );
}
type HeadingTextProps = {
  text: string;
};

function HeadingText({ text }: HeadingTextProps) {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full">
      <p className="flex-[1_0_0] font-['Roboto_Flex:Bold',sans-serif] font-bold leading-[16px] min-h-px min-w-px not-italic relative text-[#101828] text-[16px] whitespace-pre-wrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text}
      </p>
    </div>
  );
}

export default function Container() {
  return (
    <div className="content-stretch flex gap-[20px] items-start relative size-full" data-name="Container">
      <Container2>
        <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-h-px min-w-px relative w-full" data-name="Container">
          <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="Contents">
            <div className="content-stretch flex flex-col gap-[15.02px] items-start relative shrink-0 w-[197.88px]" data-name="Container">
              <HeadingText text="Free" />
              <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Container">
                <PriceText text="0" />
              </div>
            </div>
            <Container1 additionalClassNames="h-[0.939px] w-[197.88px]" />
            <div className="content-stretch flex flex-col gap-[18.774px] items-start relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <HeadingText1 text="ActualitÃƒÆ’Ã‚Â©s" additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col gap-[9.387px] items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Wrapper5>
                      <path d={svgPaths.p154edd90} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25163" />
                    </Wrapper5>
                    <TextText text="Unlimited" />
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon />
                    <Text8>{`Full Article: `}</Text8>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <HeadingText1 text="Job Board" additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col gap-[9.387px] items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Wrapper5>
                      <path d={svgPaths.p11524780} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25163" />
                    </Wrapper5>
                    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
                      <Text6 text="Unlimited" />
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon />
                    <Text8>{`Candidatures / Mois: `}</Text8>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <HeadingText1 text="Petites Annonces" additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col gap-[9.387px] items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Wrapper5>
                      <path d={svgPaths.p1b743f00} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25163" />
                    </Wrapper5>
                    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
                      <Text6 text="Unlimited" />
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Wrapper5>
                      <path d={svgPaths.p16e6ff80} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25163" />
                    </Wrapper5>
                    <Text8>{`Achat: `}</Text8>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <Heading additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Wrapper5>
                      <path d={svgPaths.p3d9ffa00} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25163" />
                    </Wrapper5>
                    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
                      <Text6 text="Unlimited" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Wrapper additionalClassNames="bg-black">
            <Text5 text="Commencer" />
          </Wrapper>
        </div>
      </Container2>
      <Container2>
        <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-h-px min-w-px relative w-full" data-name="Container">
          <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="Contents">
            <div className="content-stretch flex flex-col gap-[15.02px] items-start relative shrink-0 w-[197.88px]" data-name="Container">
              <HeadingText text="Starter" />
              <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Container">
                <PriceText text="15 000" />
              </div>
            </div>
            <Container1 additionalClassNames="h-[0.939px] w-[197.88px]" />
            <div className="content-stretch flex flex-col gap-[18.774px] items-start relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <HeadingText1 text="ActualitÃƒÆ’Ã‚Â©s" additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col gap-[9.387px] items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon1 />
                    <TextText text="Unlimited" />
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon1 />
                    <Text9>{`Full Article: `}</Text9>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <HeadingText1 text="Job Board" additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col gap-[9.387px] items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Wrapper5>
                      <path d={svgPaths.pcdc6160} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25163" />
                    </Wrapper5>
                    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
                      <Text6 text="Unlimited" />
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon1 />
                    <Wrapper1>{`Candidatures / Mois: `}</Wrapper1>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <HeadingText1 text="Petites Annonces" additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col gap-[9.387px] items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon1 />
                    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
                      <Text6 text="Unlimited" />
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Wrapper5>
                      <path d={svgPaths.p1b781b40} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25163" />
                    </Wrapper5>
                    <Wrapper1>{`Achat: `}</Wrapper1>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon1 />
                    <Wrapper1>{`Annonce Vidy Varotra: `}</Wrapper1>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <Heading additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon1 />
                    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
                      <Text6 text="Unlimited" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ButtonPrimary>{`Choisir  Starter`}</ButtonPrimary>
        </div>
      </Container2>
      <Container2>
        <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-h-px min-w-px relative w-full" data-name="Container">
          <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="Contents">
            <div className="content-stretch flex flex-col gap-[15.02px] items-start relative shrink-0 w-[197.88px]" data-name="Container">
              <HeadingText text="Essentiel" />
              <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Container">
                <PriceText1 text="25 000" />
              </div>
            </div>
            <Container1 additionalClassNames="h-[0.939px] w-[197.88px]" />
            <div className="content-stretch flex flex-col gap-[18.774px] items-start relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <HeadingText1 text="ActualitÃƒÆ’Ã‚Â©s" additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col gap-[9.387px] items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
                      <Text6 text="Unlimited" />
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <Wrapper6 additionalClassNames="h-[18.774px] w-[175.35px]">
                      <span className="leading-[14px]">{`Full Article: `}</span>
                      <Text7 text="60" />
                    </Wrapper6>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <HeadingText1 text="Job Board" additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col gap-[9.387px] items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon3 />
                    <TextText text="Unlimited" />
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <Text10 additionalClassNames="h-[18.774px] w-[175.35px]">{`Candidatures / Mois: `}</Text10>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon4 />
                    <Wrapper1>{`Annonce recrutement: `}</Wrapper1>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <HeadingText1 text="Petites Annonces" additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col gap-[9.387px] items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
                      <Text6 text="Unlimited" />
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon4 />
                    <Text10 additionalClassNames="h-[18.774px] w-[175.35px]">{`Achat: `}</Text10>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <Text10 additionalClassNames="h-[18.774px] w-[175.35px]">{`Annonce Vidy Varotra: `}</Text10>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <Heading additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
                      <Text6 text="Unlimited" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Wrapper additionalClassNames="bg-black">
            <Text5 text="Choisir Essentiel" />
          </Wrapper>
        </div>
      </Container2>
      <div className="bg-gradient-to-b flex-[1_0_0] from-[#f9fafb] h-full min-h-px min-w-px relative rounded-[12px] to-white" data-name="Container">
        <div aria-hidden="true" className="absolute border border-[#27624f] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)]" />
        <div className="flex flex-col items-center justify-center size-full">
          <div className="content-stretch flex flex-col gap-[10px] items-center justify-center p-[14px] relative size-full">
            <div className="bg-[#27624f] content-stretch flex items-center justify-center px-[14px] py-[10px] relative rounded-[31498264px] shadow-[0px_3.755px_5.632px_0px_rgba(0,0,0,0.1),0px_1.877px_3.755px_0px_rgba(0,0,0,0.1)] shrink-0" data-name="Container">
              <p className="font-['Inter:Medium',sans-serif] font-medium leading-[18.774px] not-italic relative shrink-0 text-[13.142px] text-white">Le plus populaire</p>
            </div>
            <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-h-px min-w-px relative w-full" data-name="Container">
              <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="Contents">
                <div className="content-stretch flex flex-col gap-[15.02px] items-start relative shrink-0 w-[197.88px]" data-name="Container">
                  <HeadingText text="Pro" />
                  <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Container">
                    <PriceText1 text="75 000" />
                  </div>
                </div>
                <Container1 additionalClassNames="h-[0.957px] w-full" />
                <div className="content-stretch flex flex-col gap-[19.15px] items-start relative shrink-0 w-full" data-name="Container">
                  <div className="content-stretch flex flex-col gap-[11.49px] items-start relative shrink-0 w-full" data-name="Container">
                    <HeadingText1 text="ActualitÃƒÆ’Ã‚Â©s" additionalClassNames="h-[19.15px]" />
                    <div className="content-stretch flex flex-col gap-[9.575px] items-start relative shrink-0 w-full" data-name="List">
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Wrapper3>
                          <path d={svgPaths.p2da65d00} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.27666" />
                        </Wrapper3>
                        <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
                          <Text6 text="Unlimited" />
                        </div>
                      </div>
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Icon5 />
                        <Text additionalClassNames="h-[19.15px] w-[178.857px]" />
                      </div>
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Icon6 />
                        <Text10 additionalClassNames="h-[19.15px] w-[178.857px]">{`Articles sponsorisÃƒÆ’Ã‚Â©s: `}</Text10>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[11.49px] items-start relative shrink-0 w-full" data-name="Container">
                    <HeadingText1 text="Job Board" additionalClassNames="h-[19.15px]" />
                    <div className="content-stretch flex flex-col gap-[9.575px] items-start relative shrink-0 w-full" data-name="List">
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Wrapper3>
                          <path d={svgPaths.p12bc1000} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.27666" />
                        </Wrapper3>
                        <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
                          <Text6 text="Unlimited" />
                        </div>
                      </div>
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Icon7 />
                        <Text1 />
                      </div>
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Icon7 />
                        <Wrapper6 additionalClassNames="h-[19.15px] w-[178.857px]">
                          <span className="leading-[14px]">{`Annonce recrutement: `}</span>
                          <Text7 text="15" />
                        </Wrapper6>
                      </div>
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Icon5 />
                        <Text2 additionalClassNames="shrink-0 w-[178.857px]" />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[11.49px] items-start relative shrink-0 w-full" data-name="Container">
                    <HeadingText1 text="Petites Annonces" additionalClassNames="h-[19.15px]" />
                    <div className="content-stretch flex flex-col gap-[9.575px] items-start relative shrink-0 w-full" data-name="List">
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Icon5 />
                        <div className="content-stretch flex flex-[1_0_0] items-center justify-center min-h-px min-w-px relative" data-name="Text">
                          <Text6 text="Unlimited" />
                        </div>
                      </div>
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Icon5 />
                        <div className="content-stretch flex flex-[1_0_0] h-[19.15px] items-start min-h-px min-w-px relative" data-name="Text">
                          <Helper />
                        </div>
                      </div>
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Icon6 />
                        <Text11>{`Annonce Vidy Varotra: `}</Text11>
                      </div>
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Icon5 />
                        <Text2 additionalClassNames="flex-[1_0_0] min-h-px min-w-px" />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[11.49px] items-start relative shrink-0 w-full" data-name="Container">
                    <Heading additionalClassNames="h-[19.15px]" />
                    <div className="content-stretch flex flex-col gap-[9.575px] items-start relative shrink-0 w-full" data-name="List">
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Icon5 />
                        <div className="content-stretch flex flex-[1_0_0] items-end min-h-px min-w-px relative" data-name="Text">
                          <Text6 text="Unlimited" />
                        </div>
                      </div>
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Icon5 />
                        <Wrapper8>
                          <span className="leading-[14px]">{`Souscription (rÃƒÆ’Ã‚Â©ponse): `}</span>
                          <Text7 text="10" />
                        </Wrapper8>
                      </div>
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Wrapper4>
                          <path d={svgPaths.p349e6300} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.27666" />
                        </Wrapper4>
                        <Text11>{`Annonce AO: `}</Text11>
                      </div>
                      <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                        <Wrapper3>
                          <path d={svgPaths.p35cf9d80} id="Vector" stroke="var(--stroke-0, #16A34A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.27666" />
                        </Wrapper3>
                        <Text2 additionalClassNames="flex-[1_0_0] min-h-px min-w-px" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Wrapper additionalClassNames="bg-[#27624f]">
                <Text5 text="Passer ÃƒÆ’Ã‚Â  Pro" />
              </Wrapper>
            </div>
          </div>
        </div>
      </div>
      <Container2>
        <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-h-px min-w-px relative w-full" data-name="Container">
          <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="Contents">
            <div className="content-stretch flex flex-col gap-[15.02px] items-start relative shrink-0 w-[197.88px]" data-name="Container">
              <HeadingText text="Business" />
              <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="Container">
                <PriceText1 text="150 000" />
              </div>
            </div>
            <Container1 additionalClassNames="h-[0.939px] w-[197.88px]" />
            <div className="content-stretch flex flex-col gap-[18.774px] items-start relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <HeadingText1 text="ActualitÃƒÆ’Ã‚Â©s" additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col gap-[9.387px] items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
                      <Text6 text="Unlimited" />
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <Text additionalClassNames="h-[18.774px] w-[175.35px]" />
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <Text9>{`Articles sponsorisÃƒÆ’Ã‚Â©s: `}</Text9>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <HeadingText1 text="Job Board" additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col gap-[9.387px] items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon3 />
                    <div className="content-stretch flex flex-[1_0_0] items-center justify-center min-h-px min-w-px relative" data-name="Text">
                      <Text6 text="Unlimited" />
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <Text1 />
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <Wrapper2 additionalClassNames="justify-center">{`Annonce recrutement: `}</Wrapper2>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon3 />
                    <Text3 />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <HeadingText1 text="Petites Annonces" additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col gap-[9.387px] items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon3 />
                    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
                      <Text6 text="Unlimited" />
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <div className="content-stretch flex h-[18.774px] items-start relative shrink-0 w-[175.35px]" data-name="Text">
                      <Helper />
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <Wrapper2>{`Annonce Vidy Varotra: `}</Wrapper2>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <Text3 />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[11.265px] items-start relative shrink-0 w-full" data-name="Container">
                <Heading additionalClassNames="h-[18.774px]" />
                <div className="content-stretch flex flex-col gap-[9.387px] items-start relative shrink-0 w-full" data-name="List">
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
                      <Text6 text="Unlimited" />
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <Wrapper2>{`Souscription (rÃƒÆ’Ã‚Â©ponse): `}</Wrapper2>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <Wrapper6 additionalClassNames="h-[18.774px] w-[175.35px]">
                      <span className="leading-[14px]">{`Annonce AO: `}</span>
                      <Text7 text="Unlimited" />
                    </Wrapper6>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="List Item">
                    <Icon2 />
                    <Text3 />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <ButtonPrimary>{`Choisir  Business`}</ButtonPrimary>
        </div>
      </Container2>
    </div>
  );
}
