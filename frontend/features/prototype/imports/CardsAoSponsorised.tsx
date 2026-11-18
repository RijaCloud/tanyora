// @ts-nocheck
"use client";

// @ts-nocheck
const imgCardsAoSponsorised = "/prototype-assets/cd55c3a38803e0c753c695a68807419b47bb05a8.png";
const imgCardsAoSponsorised1 = "/prototype-assets/72e8b85be548f804bce7e5a170b77b4bc995dc29.png";

export default function CardsAoSponsorised() {
  return (
    <div className="content-stretch flex items-end justify-center p-[15px] relative rounded-[12px] size-full" data-name="Cards AO sponsorised">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
        <div className="absolute bg-[#fafafa] inset-0 rounded-[12px]" />
        <div className="absolute inset-0 overflow-hidden rounded-[12px]">
          <img alt="" className="absolute h-[282.66%] left-[-52.68%] max-w-none top-[-102.3%] w-[175.22%]" src={imgCardsAoSponsorised} />
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-[12px]">
          <img alt="" className="absolute h-full left-[-35.47%] max-w-none top-0 w-[138.89%]" src={imgCardsAoSponsorised1} />
        </div>
        <div className="absolute bg-gradient-to-b from-[42%] from-[rgba(21,24,29,0)] inset-0 rounded-[12px] to-[#15181d] to-[82%]" />
      </div>
      <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="relative shrink-0 w-[150px]" data-name="Cards parent">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start p-[10px] relative w-full">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Blog texte">
            <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-center text-white w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
              <p className="leading-[20px] whitespace-pre-wrap">Agances Jirama</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
