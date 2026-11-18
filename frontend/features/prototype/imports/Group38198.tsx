// @ts-nocheck
"use client";

// @ts-nocheck
const imgRectangle4848 = "/prototype-assets/47b7587af10d29e7ce1f438f34a26475dd52c698.png";

export default function Group() {
  return (
    <div className="relative size-full">
      <div className="absolute bg-[#15181d] h-[250px] left-0 rounded-[15.703px] top-0 w-[236px]">
        <div aria-hidden="true" className="absolute border-[#27624f] border-[2.617px] border-solid inset-[-2.617px] pointer-events-none rounded-[18.32px]" />
      </div>
      <div className="absolute content-stretch flex flex-col gap-[13.086px] h-[226.504px] items-center justify-end left-[3.56px] top-[4.38px] w-[228.436px]">
        <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[12px] w-full">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
            <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgRectangle4848} />
            <div className="absolute bg-gradient-to-b from-[50.251%] from-[rgba(21,24,29,0)] inset-0 rounded-[12px] to-[#15181d]" />
          </div>
        </div>
        <div className="relative shrink-0 w-full">
          <div className="content-stretch flex flex-col gap-[13.086px] items-start leading-[0] not-italic px-[13.086px] relative w-full">
            <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold h-[35.332px] justify-center relative shrink-0 text-[24px] text-white w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
              <p className="leading-[16px] whitespace-pre-wrap">Annuaires</p>
            </div>
            <div className="flex flex-col font-['Roboto_Flex:Medium',sans-serif] font-medium justify-center relative shrink-0 text-[#a3a3a3] text-[16px] w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
              <p className="leading-[normal] whitespace-pre-wrap">{`Le carnet d'adresses qui fait la diffÃƒÆ’Ã‚Â©rence. `}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
