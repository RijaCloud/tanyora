> ## 2424.MG Homepage UI Refresh — Development Directive
>
> Update the 2424.MG news and e-commerce portal homepage according to the revised 2424.MG design system. Preserve the editorial, high-energy media identity while improving hierarchy, scanning, responsiveness, accessibility, and interaction clarity.
>
> ### 1. Design tokens
>
> css
> --color-dark: #190A0A;       /* Black Red */
> --color-red: #EA2828;        /* Red Blood */
> --color-white: #FFFFFF;      /* Blank Space */
> --color-cream: #FFF3D2;      /* Jaune */
> --color-navy: #111135;       /* Premium Blue */
> --color-purple: #D9C8FF;     /* Flushy Purple */
> 
>
> ### 2. Typography
>
> - Main typeface: Remark Neue.
> - Only use weights 500 and 700. Do not use 100, 300, or 400.
> - Figo Shiftz is an accent typeface only. Use it sparingly for:
>   - One or two highlighted italic words within a headline
>   - Small editorial/category accents
>   - Oversized quotation marks
> - Do not use Figo Shiftz for full headlines, navigation, body copy, card titles, product titles, or buttons.
> - Main headlines, article titles, menu items, labels, CTAs, and body copy must use Remark Neue.
>
> ### 3. Themes
>
> Implement an accessible dark/light theme toggle in the header.
>
> - Dark mode default: page background #190A0A; primary text #FFFFFF.
> - Light mode: page background #FFFFFF; primary text #190A0A.
> - Keep #EA2828 as the principal action and highlight color in both modes.
> - Adapt dividers, borders, muted text, and secondary surfaces per mode so all text and controls remain readable.
> - The toggle must use an accessible label and clearly state the destination mode, for example “CLAIR” or “SOMBRE”.
>
> ### 4. Buttons and interactions
>
> All buttons must use Remark Neue at weight 700; never use the serif font.
>
> - Primary CTA:
>   - Background #EA2828
>   - White text
>   - Fully pill-shaped (border-radius: 999px)
>   - Minimum height 44px; desktop target 48px
>   - Horizontal padding between 16px and 20px
>   - Optional trailing circular icon area with ↗️
> - Secondary button:
>   - Transparent or white surface
>   - 1px adaptive border
>   - Dark text in light mode; white text in dark mode
>   - Pill-shaped
> - Arrow/action buttons:
>   - Circular #EA2828 surface
>   - White → or ↗️ icon
>   - Minimum 40×40px on cards; 48×48px on hero/video content
> - Hover/focus:
>   - Add a subtle lift (translateY(-2px)) and restrained shadow/glow.
>   - Use a visible focus ring with sufficient contrast.
> - Disabled state:
>   - 45% opacity, no hover movement, legible text.
> - All interactive targets must be at least 44×44px and have appropriate accessible labels.
>
> ### 5. Corner-radius system
>
> Apply this consistently throughout the UI:
>
> - Main hero blocks and large promotional panels: 24px
> - Feature cards and coloured editorial cards: 20px
> - Article/media thumbnails: 18px
> - Small product/e-commerce cards: 16px
> - Logo container: 12px
> - Tags, CTA buttons, toggles: 999px
> - Arrow buttons: 50%
>
> Keep the red divider lines and graphic grid language sharp; do not round every structural divider or page edge.
>
> ### 6. Navigation and header
>
> - Header must include: menu trigger, MG 2424 logo, navigation, theme toggle, and primary “Visiter notre siteweb” CTA.
> - Use a simple high-contrast header with a red top rule and subtle adaptive bottom border.
> - Navigation labels should be compact, uppercase, and easy to scan.
> - On mobile, collapse navigation into an accessible menu while keeping the logo, theme control, and primary action discoverable.
>
> ### 7. Editorial components
>
> - Category headers:
>   - Prefix: ACTUS in bold red Remark Neue
>   - Category name: Remark Neue by default
>   - Figo Shiftz may be used only on a single small accent word where appropriate
> - Tags:
>   - Red background, white bold uppercase text, pill-shaped.
> - Red divider:
>   - Add a thin red horizontal line below article/category labels or at the top of story cards.
> - Quotes:
>   - Use oversized red Figo Shiftz quotation marks.
>   - Quote copy itself uses bold Remark Neue.
> - Media:
>   - Use rounded image/video containers.
>   - Support optional subtle checkerboard/pixel overlays using semi-transparent red and dark blocks.
>   - Keep overlays decorative only; they must not compromise image legibility or text contrast.
>
> ### 8. Homepage structure
>
> - Live-news ticker beneath the header.
> - Main hero story with strong image, category tag, headline, and circular arrow action.
> - Supporting coloured editorial cards using cream and purple.
> - Article grid with clear imagery, category, title, timestamp/read time, and image action button.
> - E-commerce feature section using the navy surface with rounded white product tiles.
> - Editorial quote component.
> - Compact responsive footer.
>
> ### 9. UX and accessibility requirements
>
> - Maintain clear hierarchy: category → headline → supporting metadata → action.
> - Ensure body text, metadata, controls, and borders meet accessible contrast in both themes.
> - Do not rely solely on colour to communicate category, live status, focus, or interaction.
> - Respect keyboard navigation and visible focus states.
> - Use semantic landmarks, real buttons for actions, and descriptive accessible labels for icon-only controls.
> - Ensure responsive layouts work cleanly at mobile, tablet, and desktop widths.
> - Avoid overcrowded cards; retain sufficient padding and consistent spacing between sections.