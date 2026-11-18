// @ts-nocheck
"use client";

// @ts-nocheck
import clsx from "clsx";
const imgRectangle4845 = "/prototype-assets/4a6733cf1e1ab28d66f3b7eaf57dbe937478280c.png";
const imgRectangle4846 = "/prototype-assets/dfc3624f268495edc493c7c6df1be9f622e5809c.png";
const imgRectangle4847 = "/prototype-assets/cbd3a138766228da19104ba5f969030a180f9fc3.png";
const imgRectangle4848 = "/prototype-assets/c37bad47617250953d4216bea025f6c881ea1839.png";
const imgRectangle4849 = "/prototype-assets/a59492c8e2b01d0ad4b7fa48cc8ad33473121174.png";
const imgRectangle4850 = "/prototype-assets/47b7587af10d29e7ce1f438f34a26475dd52c698.png";

function Wrapper2({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[92px] relative rounded-[10px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[10px]">
        {children}
      </div>
    </div>
  );
}

function Wrapper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a3a3a3] text-[12px] w-full">
      <p className="leading-[14px] whitespace-pre-wrap">{children}</p>
    </div>
  );
}

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="content-stretch flex flex-col gap-[10px] items-start p-[10px] relative w-full">{children}</div>
    </div>
  );
}
type FeaturesHomeCardFeatureProps = {
  additionalClassNames?: string;
};

function FeaturesHomeCardFeature({ children, additionalClassNames = "" }: React.PropsWithChildren<FeaturesHomeCardFeatureProps>) {
  return (
    <div className={clsx("bg-[#15181d] relative rounded-[12px] shrink-0", additionalClassNames)}>
      <div className="flex flex-row items-end justify-center size-full">
        <div className="content-stretch flex items-end justify-center p-[2px] relative w-full">
          <div className="flex flex-[1_0_0] flex-row items-end self-stretch">{children}</div>
        </div>
      </div>
    </div>
  );
}
type TextProps = {
  text: string;
};

function Text({ text }: TextProps) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-end leading-[0] not-italic relative shrink-0 text-[16px] text-white w-full">
      <p className="leading-[16px] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type ContentsProps = {
  text: string;
  text1: string;
};

function Contents({ text, text1 }: ContentsProps) {
  return (
    <Wrapper>
      <Text text={text} />
      <Wrapper1>{text1}</Wrapper1>
      <BoutonType className="relative shrink-0 w-full" property1="Light" />
    </Wrapper>
  );
}
type BoutonTypeProps = {
  className?: string;
  property1?: "Light" | "Dark";
};

function BoutonType({ className, property1 = "Dark" }: BoutonTypeProps) {
  const isLight = property1 === "Light";
  return (
    <div className={className || "relative w-[81px]"}>
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[7px] items-center relative w-full">
          <div className={`flex flex-col font-["Roboto_Flex:Regular",sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[13.039px] whitespace-nowrap ${isLight ? "text-white" : "text-black"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
            <p className="leading-[normal]">Lire Plus</p>
          </div>
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Arrow / Arrow Right 1">
            <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[24px] top-1/2" data-name="Icon Frame">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                <g id="Icon Frame">
                  <g id="Base" />
                  <path d="M19 12L5 12" id="Vector" stroke={isLight ? "var(--stroke-0, #27624f)" : "var(--stroke-0, #292929)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  <path d="M12 19L19 12L12 5" id="Vector_2" stroke={isLight ? "var(--stroke-0, #27624f)" : "var(--stroke-0, #292929)"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <div className="content-stretch flex gap-[20px] items-center relative size-full" data-name="Features">
      <FeaturesHomeCardFeature additionalClassNames="w-[177px]">
        <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-h-px min-w-px relative" data-name="Container">
          <Wrapper2>
            <img alt="" className="absolute max-w-none object-cover rounded-[10px] size-full" src={imgRectangle4845} />
            <div className="absolute bg-gradient-to-b from-[67.391%] from-[rgba(21,24,29,0)] inset-0 rounded-[10px] to-[#15181d] to-[97.283%]" />
          </Wrapper2>
          <Contents text="ActualitÃƒÆ’Ã‚Â©s" text1="Restez informÃƒÆ’Ã‚Â© des derniÃƒÆ’Ã‚Â¨res nouvelles" />
        </div>
      </FeaturesHomeCardFeature>
      <FeaturesHomeCardFeature additionalClassNames="w-[171.96px]">
        <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-h-px min-w-px relative" data-name="Container">
          <Wrapper2>
            <div className="absolute inset-0 overflow-hidden rounded-[10px]">
              <img alt="" className="absolute h-[236.58%] left-0 max-w-none top-[-86.18%] w-[99.98%]" src={imgRectangle4845} />
            </div>
            <img alt="" className="absolute max-w-none object-cover rounded-[10px] size-full" src={imgRectangle4846} />
            <div className="absolute bg-gradient-to-b from-[50.251%] from-[rgba(21,24,29,0)] inset-0 rounded-[10px] to-[#15181d] to-[95.938%]" />
          </Wrapper2>
          <Wrapper>
            <Text text="Petites Annonces" />
            <Wrapper1>{`Achetez, vendez ou ÃƒÆ’Ã‚Â©changez facilement. `}</Wrapper1>
            <BoutonType className="relative shrink-0 w-full" property1="Light" />
          </Wrapper>
        </div>
      </FeaturesHomeCardFeature>
      <FeaturesHomeCardFeature additionalClassNames="w-[177px]">
        <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-h-px min-w-px relative" data-name="Container">
          <Wrapper2>
            <img alt="" className="absolute max-w-none object-cover rounded-[10px] size-full" src={imgRectangle4847} />
            <div className="absolute bg-gradient-to-b from-[50.251%] from-[rgba(21,24,29,0)] inset-0 rounded-[10px] to-[#15181d] to-[95.938%]" />
          </Wrapper2>
          <Contents text="Offres dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢emploi" text1="Trouvez le poste qui correspond ÃƒÆ’Ã‚Â  vos ambitions" />
        </div>
      </FeaturesHomeCardFeature>
      <FeaturesHomeCardFeature additionalClassNames="w-[177px]">
        <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-h-px min-w-px relative" data-name="Container">
          <Wrapper2>
            <div className="absolute inset-0 overflow-hidden rounded-[10px]">
              <img alt="" className="absolute h-[174.22%] left-[-47.41%] max-w-none top-[-51.81%] w-[194.82%]" src={imgRectangle4848} />
            </div>
            <div className="absolute bg-gradient-to-b from-[50.251%] from-[rgba(21,24,29,0)] inset-0 rounded-[10px] to-[#15181d] to-[95.938%]" />
          </Wrapper2>
          <Contents text="Appels dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢offre" text1="Restez informÃƒÆ’Ã‚Â© des derniÃƒÆ’Ã‚Â¨res nouvelles" />
        </div>
      </FeaturesHomeCardFeature>
      <FeaturesHomeCardFeature additionalClassNames="w-[177px]">
        <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-h-px min-w-px relative" data-name="Container">
          <Wrapper2>
            <img alt="" className="absolute max-w-none object-cover rounded-[10px] size-full" src={imgRectangle4849} />
            <div className="absolute bg-gradient-to-b from-[50.251%] from-[rgba(21,24,29,0)] inset-0 rounded-[10px] to-[#15181d] to-[95.938%]" />
          </Wrapper2>
          <Contents text="Web Radio" text1="Restez informÃƒÆ’Ã‚Â© des derniÃƒÆ’Ã‚Â¨res nouvelles" />
        </div>
      </FeaturesHomeCardFeature>
      <FeaturesHomeCardFeature additionalClassNames="w-[177px]">
        <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-h-px min-w-px relative" data-name="Container">
          <Wrapper2>
            <img alt="" className="absolute max-w-none object-cover rounded-[10px] size-full" src={imgRectangle4850} />
            <div className="absolute bg-gradient-to-b from-[50.251%] from-[rgba(21,24,29,0)] inset-0 rounded-[10px] to-[#15181d] to-[95.938%]" />
          </Wrapper2>
          <Contents text="Annuaires" text1="Restez informÃƒÆ’Ã‚Â© des derniÃƒÆ’Ã‚Â¨res nouvelles" />
        </div>
      </FeaturesHomeCardFeature>
    </div>
  );
}
