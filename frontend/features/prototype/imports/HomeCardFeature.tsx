// @ts-nocheck
"use client";

// @ts-nocheck
const imgRectangle4845 = "/prototype-assets/4a6733cf1e1ab28d66f3b7eaf57dbe937478280c.png";
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

export default function HomeCardFeature() {
  return (
    <div className="bg-[#15181d] relative rounded-[12px] size-full" data-name="Home - Card feature">
      <div className="flex flex-row items-end justify-center size-full">
        <div className="content-stretch flex items-end justify-center p-[2px] relative size-full">
          <div className="flex flex-[1_0_0] flex-row items-end self-stretch">
            <div className="content-stretch flex flex-[1_0_0] flex-col h-full items-center justify-end min-h-px min-w-px relative" data-name="Container">
              <div className="h-[92px] relative rounded-[10px] shrink-0 w-full">
                <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[10px]">
                  <img alt="" className="absolute max-w-none object-cover rounded-[10px] size-full" src={imgRectangle4845} />
                  <div className="absolute bg-gradient-to-b from-[67.391%] from-[rgba(21,24,29,0)] inset-0 rounded-[10px] to-[#15181d] to-[97.283%]" />
                </div>
              </div>
              <div className="relative shrink-0 w-full" data-name="Contents">
                <div className="content-stretch flex flex-col gap-[10px] items-start p-[10px] relative w-full">
                  <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-end leading-[0] not-italic relative shrink-0 text-[16px] text-white w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    <p className="leading-[16px] whitespace-pre-wrap">ActualitÃƒÆ’Ã‚Â©s</p>
                  </div>
                  <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a3a3a3] text-[12px] w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    <p className="leading-[14px] whitespace-pre-wrap">Restez informÃƒÆ’Ã‚Â© des derniÃƒÆ’Ã‚Â¨res nouvelles</p>
                  </div>
                  <BoutonType className="relative shrink-0 w-full" property1="Light" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
