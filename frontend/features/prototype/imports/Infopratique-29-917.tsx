// @ts-nocheck
"use client";

// @ts-nocheck
import clsx from "clsx";
import svgPaths from "./svg-i875ujxrm5";
type CountryInfoProps = {
  additionalClassNames?: string;
};

function CountryInfo({ children, additionalClassNames = "" }: React.PropsWithChildren<CountryInfoProps>) {
  return (
    <div className={clsx("h-[19px] relative rounded-[8px] shrink-0 w-full", additionalClassNames)}>
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[4px] py-[2px] relative size-full">{children}</div>
      </div>
    </div>
  );
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <p style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("relative shrink-0", additionalClassNames)}>
      {text}
    </p>
  );
}

function Group() {
  return (
    <div className="absolute inset-[28.63%_10.51%_28.75%_10.51%]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.97697 5.38322">
        <g id="Group">
          <path d={svgPaths.p3789e080} fill="var(--fill-0, #111827)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

export default function Infopratique() {
  return (
    <div className="content-stretch flex gap-[14px] items-center justify-center relative size-full" data-name="Infopratique">
      <div className="overflow-clip relative rounded-[4px] shrink-0 size-[24px]" data-name="iconoir:pharmacy-cross-tag">
        <div className="absolute inset-[11.99%_12.5%_13.01%_12.5%]" data-name="Group">
          <div className="absolute inset-[-5.56%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
              <g id="Group">
                <path d={svgPaths.p1ab8fc00} id="Vector" stroke="var(--stroke-0, black)" strokeWidth="2" />
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
          <div className="absolute bg-[#4992ff] inset-0 rounded-[8px]" />
        </div>
        <p className="absolute font-['Roboto_Flex:Bold',sans-serif] font-bold inset-[13.64%_44.9%_33.33%_9.52%] leading-[normal] not-italic text-[13.91px] text-white whitespace-pre-wrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
          25Ãƒâ€šÃ‚ÂºC
        </p>
        <p className="absolute font-['Product_Sans:Regular',sans-serif] inset-[60.61%_51.02%_21.21%_9.52%] leading-[normal] not-italic text-[7.01px] text-[rgba(255,255,255,0.35)] whitespace-pre-wrap">Antananarivo</p>
        <div className="absolute inset-[20.1%_16.67%_43.18%_68.52%]">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
            <g id="Ellipse 4" />
          </svg>
        </div>
        <div className="absolute inset-[24.24%_21.77%_46.97%_65.31%]">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.3129 13.3129">
            <circle cx="6.65646" cy="6.65646" fill="var(--fill-0, #FFAC63)" id="Ellipse 22" r="6.65646" />
          </svg>
        </div>
        <div className="absolute inset-[33.33%_6.12%_18.18%_64.63%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30.1293 22.4218">
            <g filter="url(#filter0_i_1_1083)" id="Vector">
              <path d={svgPaths.p1084f00} fill="var(--fill-0, #FAFAFA)" fillOpacity="0.74" />
              <path d={svgPaths.pcfd0180} fill="var(--fill-0, #FAFAFA)" fillOpacity="0.74" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="30.8299" id="filter0_i_1_1083" width="38.5374" x="0" y="-8.40816">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                <feOffset dx="8.40816" dy="-8.40816" />
                <feGaussianBlur stdDeviation="7.35714" />
                <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.105882 0 0 0 0 0.356863 0 0 0 0 1 0 0 0 0.3 0" />
                <feBlend in2="shape" mode="normal" result="effect1_innerShadow_1_1083" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[8px] items-start py-[10px] relative rounded-[4px] shrink-0 w-[137px]" data-name="Exchange">
        <CountryInfo additionalClassNames="bg-[#f9fafb]">
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
            <div className="overflow-clip relative shrink-0 size-[12.632px]" data-name="Dropdown Icon">
              <Group />
            </div>
          </div>
          <div className="content-stretch flex font-['Roboto_Flex:Regular',sans-serif] font-normal gap-[4px] items-center leading-[normal] not-italic relative shrink-0 text-[#111827]">
            <Text text="1" additionalClassNames="text-[12px]" />
            <Text text="USA" additionalClassNames="text-[10px]" />
          </div>
        </CountryInfo>
        <CountryInfo additionalClassNames="bg-[#d4d4d4]">
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
            <div className="overflow-clip relative shrink-0 size-[12.632px]" data-name="Dropdown Icon">
              <Group />
            </div>
          </div>
          <div className="content-stretch flex gap-[4px] items-center leading-[normal] not-italic relative shrink-0 text-[#111827]">
            <Text text="4 532" additionalClassNames="font-['Roboto_Flex:Regular',sans-serif] font-normal text-[12px]" />
            <Text text="MGA" additionalClassNames="font-['Roboto_Flex:Bold',sans-serif] font-bold text-[10px]" />
          </div>
        </CountryInfo>
      </div>
    </div>
  );
}
