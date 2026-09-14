export type PatchEntry = {
  id: string;
  date: string;
  title: string;
  added: string[];
};

export const PATCHES: PatchEntry[] = [
  {
    id: "2026-09-14-phone-sms-otp",
    date: "September 14, 2026",
    title: "Phone signup needs a texted 6-digit code",
    added: [
      "Create account with a US phone opens the code screen. We text a 6-digit code that expires in 10 minutes. Email still uses the inbox code. Desk Admin, Google, and X skip this.",
      "Refreshing while the phone is unverified stays on the code screen. Checkout and Place order wait until the number is verified.",
      "If SMS is not set up on the live shop, the page says so instead of letting a phone account through with only a password.",
    ],
  },
  {
    id: "2026-09-14-email-otp-social",
    date: "September 14, 2026",
    title: "Email signup needs a 6-digit code",
    added: [
      "Create account with a real email opens the code screen. The message expires in 60 seconds. Phone, desk Admin, Google, and X skip this.",
      "Refreshing while unverified stays on the code screen. Checkout and Place order wait until the email is verified.",
      "If Google and X are not set up for this shop, the buttons hide and the page says: Social sign-in isn't configured for this shop — use email.",
    ],
  },

  {
    id: "2026-09-14-login-center-oauth",
    date: "September 14, 2026",
    title: "Sign-in sits in the middle of the screen",
    added: [
      "The sign-in card is centered and fits on a phone without scrolling. Google and X sit side by side.",
      "If Google or X cannot return to this shop, the message says so instead of looking like a bad password.",
    ],
  },

  {
    id: "2026-09-13-menu-item-subdropdown",
    date: "September 13, 2026",
    title: "Menu items sit in their own drop-downs",
    added: [
      "Open a section on Menu, then tap an item name to edit it. Only one item is open at a time. Move up/down still works on the closed row.",
    ],
  },

  {
    id: "2026-09-13-note-placeholder",
    date: "September 13, 2026",
    title: "Note fields say What's happening?",
    added: [
      "Cook notes, bag notes, checkout kitchen notes, and customer/admin chat boxes no longer show example copy. The placeholder is What's happening?",
    ],
  },

  {
    id: "2026-09-13-extra-dressing-visible",
    date: "September 13, 2026",
    title: "Extra dressings sit above toppings",
    added: [
      "Buffalo Chicken Pizza shows Extra Ranch and Extra Blue cheese in the same pop-up as toppings — above the topping list, so they stay on screen.",
      "Guest copy says dressing, not dip. Wings and tenders use the same word. Prices still add in 2s from the menu.",
    ],
  },
  {
    id: "2026-09-13-toppings-tab-noscroll",
    date: "September 13, 2026",
    title: "Per-topping prices and Shop details accordions",
    added: [
      "Menu is items only. Toppings is its own tab: each topping has SM / MD / LG / XL prices, seeded at $2.25 / $3.25 / $4.25 / $5.25.",
      "Shop details opens one accordion at a time for extra-topping defaults, Bulk XL fill, Shared extras, and shop identity.",
      "Customize a pie: size, toppings, and a cook note sit in the same pop-up. Add with the live total stays at the bottom.",
    ],
  },
  {
    id: "2026-09-13-guest-pizza-blurb-off",
    date: "September 13, 2026",
    title: "Guest pizza headers are the title only",
    added: [
      "Pizza and Gourmet Pizza on the guest menu show the section name only. Extra topping prices stay on Admin notes and the wall board.",
    ],
  },
  {
    id: "2026-09-13-patch-1020",
    date: "September 13, 2026",
    title: "Grant opens the desk, wall print reflow",
    added: [
      "A granted account opens Admin and POS with no Admin mode switch. Guests still cannot.",
      "Long emails ellipsis in the account menu. Menu & Shop Details tabs scroll on a narrow phone instead of overlapping.",
      "Pizza and Gourmet headers on the guest menu show extra topping prices for SM, MD, LG, and XL.",
      "If the desk sign-in expires, Accept freezes on POS and Incoming and asks you to sign in again. Complete toast is unchanged.",
      "Wall menu print scale 110–150% reflows so names and prices do not overlap. Beverages on the wall are size and price only.",
    ],
  },
  {
    id: "2026-09-13-letter4-no-quad-marks",
    date: "September 13, 2026",
    title: "Four-sheet PDF has no corner labels",
    added: [
      "Four-sheet wall PDF pages have no 1 / 2 / 3 / 4 or top-left corner labels — those marks are gone from the screen and from Print / Save PDF.",
    ],
  },
  {
    id: "2026-09-12-financials-tickets",
    date: "September 12, 2026",
    title: "Financials is sales and tickets",
    added: [
      "Financials keeps Sales and Recent tickets. Till mix, tax, and the extra totals left the page.",
      "Search recent tickets by number. Profile opens that person in the customer book.",
    ],
  },
  {
    id: "2026-09-12-customer-book-tints",
    date: "September 12, 2026",
    title: "Remove accounts, distinct customer cards",
    added: [
      "Admins can remove an account from the customer book after a confirmation pop-up. Past tickets stay on POS.",
      "Customer cards each have their own color. Opening Profile on POS puts that person at the top of the book search.",
      "Pizza and Gourmet Pizza headers on the guest menu no longer show the extra-topping description.",
    ],
  },
  {
    id: "2026-09-12-center-wall-letter4",
    date: "September 12, 2026",
    title: "Leaner Customer Center, four-sheet wall PDF",
    added: [
      "Customer Center is Messages, Customers, and Rewards. Analytics left the customer book. Tickets stay on POS.",
      "Rewards opens on the program settings — the extra Points program card is gone.",
      "Wall menu Print / Save PDF can tile the board across four 8.5×11 sheets, portrait or landscape, for taping up.",
    ],
  },
  {
    id: "2026-09-12-hotfix-blurb-accept-toast",
    date: "September 12, 2026",
    title: "Pizza blurb follows the ladder, POS Accept toast",
    added: [
      "Pizza and Gourmet headers on the guest menu show extra topping prices for SM, MD, LG, and XL.",
      "Admin pizza section notes follow those prices and cannot be typed stale. Save writes the live blurb.",
      "Accepting a ticket on POS shows that it went to the kitchen. Completing still shows the complete toast.",
    ],
  },
  {
    id: "2026-09-12-patch-update-1528",
    date: "September 12, 2026",
    title: "Admin bulk prices, wall print scale, signed-in Review",
    added: [
      "One Admin panel sets SM/MD/LG/XL topping add-ons and the pizza blurb follows those dollars. Cheese and one-topping XL fill in one click; Gourmet XL stays blank until you type a price.",
      "One Extra Ranch, Extra Blue, and Extra dressing field writes every matching item. Chips show the menu price and Add includes it in food.",
      "Wall menu Print scale presets 100 / 110 / 125 / 150% (90–160% slider) for Print / Save PDF. Screen preview stays full size.",
      "Review order keeps a signed-in account. Desk grants stop at 14 accounts and 12 extra bots — existing grants stay.",
    ],
  },
  {
    id: "2026-09-11-menu-customize",
    date: "September 11, 2026",
    title: "Cleaner customize sheet, pasta salad, buffalo dips",
    added: [
      "Customize sheets keep one running price on Add and one helper when a pick is still required. Extra dressings and dips add in 2s from the menu price.",
      "Pasta platters pick a salad dressing and Keep bread (or No bread, no charge). Buffalo chicken pizza asks Ranch, Blue cheese, or none, with optional extra cups like wings.",
      "Add sits flush at the bottom of the sheet. Long emails in the name menu ellipsis instead of stretching the menu.",
    ],
  },
  {
    id: "2026-09-11-patch-update-2010",
    date: "September 11, 2026",
    title: "Tenders, salads, pasta shape, optional delivery fee",
    added: [
      "Chicken tenders use the same sauce and dip builder as wings. Salads require a dressing, extra dressings sell in 2s, and pasta platters ask Penne or Spaghetti — Admin can detach stuffed pastas.",
      "Extra dip and dressing prices come from the menu editor. Missing prices stay blank instead of inventing a dollar amount. Cart keeps the price from when you add the item.",
      "Delivery fee is a toggle plus a price. Off hides the Delivery line and taxes food after rewards only. On still taxes the fee. Delivery minimum stays $15 on food.",
    ],
  },
  {
    id: "2026-09-11-patch-update-1822",
    date: "September 11, 2026",
    title: "Admin tabs scroll, Northfield stays out",
    added: [
      "Admin tabs scroll on a phone instead of stacking Payments over Tax. Admin mode stays on one line in the name menu, and category arrows sit 4px from the edge.",
      "A wrong password stays on sign-in and never opens the desk. Sign-out is one step to guest. Signed-in checkout keeps the account through Review, and Delivery / POS keep the desk while the account refreshes.",
      "Northfield 08225 is outside delivery even if old paint still covers Tilton — the paint is not erased. Short Egg Harbor addresses pick up the township before the zone check.",
      "Chat lists the new ticket after you place. Under the delivery minimum, checkout says how much more to add. Blank cook notes stay blank.",
    ],
  },
  {
    id: "2026-09-11-app-transition",
    date: "September 11, 2026",
    title: "South End on the home screen, order alerts, LAN print",
    added: [
      "Add to Home Screen is named South End Pizza — cream theme, full icon set, not Grok App.",
      "After checkout or install, Enable order alerts for Ready / out-for-delivery pings. iPhone needs the home-screen icon first.",
      "Printer settings take a shop Wi-Fi IP and Test print over Epson ePOS. Bluetooth is a labeled fallback and hides where the browser cannot pair. Completes never wait on print.",
    ],
  },
  {
    id: "2026-09-11-update-auth-isolation-continuity",
    date: "September 11, 2026",
    title: "Wrong password stays on sign-in",
    added: [
      "A bad password stays on the sign-in card with a clear error and never opens a desk. Signed-in checkout keeps the account through Review. Call and Chat sit above the last menu cards, category arrows hug the phone edge, and POS shows the account menu.",
    ],
  },
  {
    id: "2026-09-11-followup-account-load",
    date: "September 11, 2026",
    title: "Desk account load no longer hangs",
    added: [
      "Admin pages load from a fast account read — no schema work on the way in. Guest /admin returns to the desk after sign-in. Category chips follow the section on screen, and Call/Chat sit clear of the last menu cards.",
    ],
  },
  {
    id: "2026-09-11-admin-mode-per-account",
    date: "September 11, 2026",
    title: "Admin mode per account",
    added: [
      "Each teammate uses their own login. Allowed accounts turn Admin mode on from the name menu. Guests cannot. Shared diagnostic desk login is no longer the path.",
    ],
  },
  {
    id: "2026-09-11-category-carousel",
    date: "September 11, 2026",
    title: "Category rail sticks, centers, and pulses",
    added: [
      "Phone arrows sit flush on the category rail. Search stays with the sticky pills. The active category slides to the middle as you browse, and the arrows pulse when you tap them.",
    ],
  },
  {
    id: "2026-09-11-staff-admin-login-column",
    date: "September 11, 2026",
    title: "Desk login toggle no longer 500s",
    added: [
      "Bot access Diagnostic Admin login writes a real column on first load. Security summary stays 200 even if the column was missing. The toggle still starts off.",
    ],
  },
  {
    id: "2026-09-11-category-headers",
    date: "September 11, 2026",
    title: "Bigger category names, no section blurbs",
    added: [
      "Menu sections are the category name only — larger and heavier. The extra line under Wings, Pizza, and the rest is gone. Item cards still show their own copy.",
    ],
  },
  {
    id: "2026-09-11-pizza-account-loader",
    date: "September 11, 2026",
    title: "Pepperoni pizza while your account connects",
    added: [
      "Sign-in and the header chip spin a pepperoni pie while the shop is connecting your account. It clears as soon as you are in.",
    ],
  },
  {
    id: "2026-09-11-bugfix-desk-wings-pos",
    date: "September 11, 2026",
    title: "Diagnostic desk, wing tens, checkout and POS polish",
    added: [
      "Diagnostic Admin login is a Bot access toggle plus a host flag. Off clears the desk password. Bots stay as they are.",
      "Complete still toasts on the Open board. Accept turns off after a ticket is Accepted. Wings sell in tens. Guest checkout no longer jumps to a leftover account.",
      "Financials Collected skips unpaid card tickets. Today uses New Jersey time. Kitchen notes stay on the device until you place the order.",
    ],
  },
  {
    id: "2026-09-11-slice-browse-wings-price",
    date: "September 11, 2026",
    title: "Slice-style menu, live wing dips, tighter phone bar",
    added: [
      "The menu is one long page. Sticky category pills scroll you to each section and follow as you browse.",
      "Wing extra Ranch / Blue cheese prices come from the menu editor (per 2 cups). Accept cards and bot tickets show sauce, dips, notes, and the money stack.",
      "On a phone the title bar is a single line — South End Pizza, icon cart, no POS for guests — and the grid stays two cards wide.",
    ],
  },
  {
    id: "2026-09-11-complete-toast-wings-guest",
    date: "September 11, 2026",
    title: "Completed toast, wings builder, guest checkout",
    added: [
      "Complete uses the same staff toast as Accept — ticket, total, and tip only — below the POS tabs.",
      "Fresh Wings require sauce and included dips. Extra dips sell in 2-cup sets at $1.50.",
      "Guests never see POS. Pickup needs name and phone. Card is a notice. Resume or start fresh on a leftover bag.",
    ],
  },
  {
    id: "2026-09-10-email-otp-resend",
    date: "September 10, 2026",
    title: "Email signup codes via Resend",
    added: [
      "Email create-account and unverified sign-in ask for a 6-digit inbox code. Phone, Google, X, and the desk Admin skip it.",
      "Password reset actually emails the code when Resend is configured. Preview still shows the code on screen.",
    ],
  },
  {
    id: "2026-09-10-pos-complete-stay-open",
    date: "September 10, 2026",
    title: "Complete closes the ticket and stays on Open",
    added: [
      "Marking a ticket Completed saves, closes the popup, and keeps the Open tab — no jump to history.",
      "Staff toast is ticket number, total, and tip only. Last ticket completed shows You're caught up.",
    ],
  },
  {
    id: "2026-09-10-style-custom-bots",
    date: "September 10, 2026",
    title: "Style bot + custom bot minting",
    added: [
      "Admin → Bot access includes a Style preset (menu/health read) and a New Customer preset.",
      "Custom mode lets you mint any future bot by name and role without another code drop.",
    ],
  },
  {
    id: "2026-09-10-admin-totp-toggle",
    date: "September 10, 2026",
    title: "Admin authenticator is optional",
    added: [
      "Admin can open the desk without an authenticator. Require it anytime under Admin → Settings → Desk security.",
    ],
  },
  {
    id: "2026-09-10-security-bot-access",
    date: "September 10, 2026",
    title: "Desk security and bot access",
    added: [
      "Shop Admin password lives only in host secrets now.",
      "Live card capture is frozen — checkout is cash or pay at pickup until a real processor is wired.",
      "Bots get their own tokens under Admin → Bot access, with least-privilege scopes and a one-time copy.",
    ],
  },
  {
    id: "2026-09-10-pos-accept-queue",
    date: "September 10, 2026",
    title: "POS accept queue is staff-safe",
    added: [
      "Incoming tickets line up oldest first, Accept can only fire once, and the board shows a ticket number confirmation.",
      "Staff account load no longer dies on a duplicate profile row.",
    ],
  },
  {
    id: "2026-09-10-admin-sign-out",
    date: "September 10, 2026",
    title: "Admin can sign out",
    added: [
      "Signing out of the Admin desk login now ends the shop session instead of leaving you signed in.",
    ],
  },
  {
    id: "2026-09-10-login-popup-origin",
    date: "September 10, 2026",
    title: "A ticket-style sign-in card",
    added: [
      "Sign in is a shop ticket over the menu, with Google and X marked clearly.",
      "Admin, Google, and X work on the published GitHub live shop, not only this preview.",
    ],
  },
  {
    id: "2026-09-10-staff-admin",
    date: "September 10, 2026",
    title: "Shop admin sign-in",
    added: [
      "Sign in with username Admin to open POS, the menu editor, and the rest of the shop desk.",
    ],
  },
  {
    id: "2026-09-10-guest-header-align",
    date: "September 10, 2026",
    title: "A cleaner guest title bar",
    added: [
      "Help and Download App stay in the signed-in name menu, not on the guest title bar.",
      "The buffalo mark is the same height as Sign in and Cart, on one line.",
    ],
  },
  {
    id: "2026-09-10-southend-app-address",
    date: "September 10, 2026",
    title: "SouthEnd app, saved address, and a cleaner pizza builder",
    added: [
      "Account details now stores a delivery street, city, and ZIP, and checkout fills them in.",
      "Summary dropped the extra jump buttons — the tabs already cover details, security, and rewards.",
      "Make it yours shows the pie photo and description. Extra toppings are tap chips; half sides only appear once a topping is on.",
      "Menu photos fill the card edge to edge. Category arrows wrap from the last chip back to the first.",
      "Download App in the name menu installs the shop app with the buffalo mark.",
      "Sign-in goes straight to the menu instead of waiting on shop setup, so the live app no longer hangs after login.",
    ],
  },
  {
    id: "2026-09-10-account-tabs-invites",
    date: "September 10, 2026",
    title: "Account tabs, invites, and a larger title mark",
    added: [
      "Help and Sign out sit in the name menu. POS and Cart match the larger title mark.",
      "Your account opens on a summary, with tabs for details, security, and rewards.",
      "Rewards shows point history and a friend invite with a copyable link and QR code.",
    ],
  },
  {
    id: "2026-09-10-header-photo-off",
    date: "September 10, 2026",
    title: "Name in the title bar, photos optional",
    added: [
      "Your name in the title bar opens Account. Admins get a dropdown for Account and Admin.",
      "Menu photos can be turned off per item so the card shrinks to text.",
    ],
  },
  {
    id: "2026-09-10-item-photos",
    date: "September 10, 2026",
    title: "Menu item photos",
    added: [
      "Every menu card now shows a food photo that matches the item name and description.",
      "Shop-uploaded photos still replace the placeholder. Remove photo to go back to the match.",
    ],
  },
  {
    id: "2026-09-10-search-scroll",
    date: "September 10, 2026",
    title: "Search in the category row",
    added: [
      "Order is off the customer title bar. The shop mark still opens the menu.",
      "Search is a short chip that scrolls with Pizza, Gourmet, and the rest, and grows when you tap it.",
    ],
  },
  {
    id: "2026-09-10-card-editor",
    date: "September 10, 2026",
    title: "Card Editor tab",
    added: [
      "Card Editor is its own tab in Menu & Shop Details.",
      "Cards can change size and paper color. Name, description, and price still have their own inks.",
      "Large type no longer spills over the photo or stacks on the price.",
    ],
  },
  {
    id: "2026-09-10-cart-pop-card-ink",
    date: "September 10, 2026",
    title: "Cart popup, Top on scroll, and card ink",
    added: [
      "Cart in the title bar opens Your order as a popup. Checkout still glows.",
      "The Top button sits with Call and Chat only after the title bar scrolls off the screen.",
      "Shop details can color menu card names, descriptions, and prices separately, with more inks.",
    ],
  },
  {
    id: "2026-09-10-admin-cart-dock",
    date: "September 10, 2026",
    title: "Admin home, checkout glow, and back to top",
    added: [
      "Admin in the title bar always opens Menu & Shop Details on the Menu tab.",
      "The admin menu lists Menu & Shop Details first, then Customer Center.",
      "Cart in the title bar pulses Checkout. The sticky bar says Checkout, and a Top button sits with Call and Chat.",
    ],
  },
  {
    id: "2026-09-10-pos-popup-hours",
    date: "September 10, 2026",
    title: "POS ticket popup, hours, and Admin home",
    added: [
      "POS opens a ticket popup with status, items, reprint, and profile — no inline dropdown.",
      "Vacation lives on the Hours tab in Menu & Shop Details.",
      "Admin in the title bar opens Menu & Shop Details. Desk is out of the admin menu.",
    ],
  },
  {
    id: "2026-09-10-search-guest-card",
    date: "September 10, 2026",
    title: "Carousel search, guest card, quieter home",
    added: [
      "Menu search sits in the category carousel. Picking a result opens that item’s confirm popup.",
      "Payments can require card for guest checkout. Signed-in customers still pay at pickup or cash.",
      "The buffalo mark stays in the title bar and is off the main menu page.",
    ],
  },
  {
    id: "2026-09-10-menu-ops-home",
    date: "September 10, 2026",
    title: "Sizes, printers, and zones in Menu & Shop Details",
    added: [
      "Pizza sizes are typed on each item in Menu & Shop Details. XL is offered when you enter an XL price — no settings toggle.",
      "Printer setup moved into a Printers tab, with Diagnose, Check connection, and a troubleshooting list.",
      "Delivery zones paint on the Delivery tab next to fee and minimum.",
      "Background is now Settings and sits at the bottom of the admin menu.",
    ],
  },
  {
    id: "2026-09-09-guest-points-chat",
    date: "September 9, 2026",
    title: "Guest checkout, rewards hub, and shop tabs",
    added: [
      "Menu & Shop Details condiments have a quantity cap guests can add (1–9).",
      "Cook notes stay focused while typing — the comment field no longer deselects.",
      "New accounts require a password and a matching confirm password.",
      "Checkout works as a guest with a name and phone, or sign in as usual.",
      "Rewards live in Customer center, with earn/redeem preview chips and wallet tools.",
      "Website edit tools left Settings. Tagline and buffalo mark sit in Shop details.",
      "Hours, vacation, payments, tax, and delivery are their own tabs in Menu & Shop Details.",
      "Menu search no longer flickers after a hit — suggestions sit in a stable slot.",
      "Chat splits sent messages from the pad where you type a new one.",
      "Item photos show the full picture instead of a tight crop, with a sharper upload.",
    ],
  },
  {
    id: "2026-09-09-condiments-confirm",
    date: "September 9, 2026",
    title: "Condiments, item notes, and steadier return",
    added: [
      "Menu & Shop Details can attach condiments to any item, with an add price and an extra price.",
      "Choosing an item opens a confirm popup: size, condiments, extra portions, and a cook note.",
      "Coming back to the shop retries a dropped connection instead of showing Failed to fetch.",
      "POS tickets, menu editor sections, and order-history trays start closed. Opening one closes the others.",
    ],
  },
  {
    id: "2026-09-08-card-type",
    date: "September 8, 2026",
    title: "Menu card text size and color",
    added: [
      "Menu & Shop Details can set the text size and color for every customer menu card.",
      "Small, Medium, Large, and Extra large, plus ink, tomato, deep red, or a custom color.",
      "Save all writes card type with prices and shop details. A live preview sits in Shop details.",
    ],
  },
  {
    id: "2026-09-08-photo-cards",
    date: "September 8, 2026",
    title: "Photo cards, flush tabs, and a steadier backdrop",
    added: [
      "Category tabs pin flush to the top of the screen after the title bar scrolls away.",
      "The page keeps a stable scrollbar gutter so short menu sections no longer shove the layout.",
      "Menu & Shop Details can attach a photo to each item. Save all writes those photos to the live menu.",
      "Item cards are the button: photo in the top 75%, name and price in the lower 25%.",
      "Closing a chat no longer posts “this chat has concluded.” The customer window just opens a fresh thread.",
      "POS Open and Complete sit beside the Menu drawer on phone and desktop.",
      "The shop backdrop covers the visitor’s window, keeps the original photo shape, and no longer drifts when scrolling or resizing.",
    ],
  },
  {
    id: "2026-09-08-ticket-desk",
    date: "September 8, 2026",
    title: "Ticket numbers, POS desk, and tighter admin chrome",
    added: [
      "Tickets now use a 6-digit number, starting at 000001.",
      "Customer chat says Send, and it stays off until an active order is picked.",
      "POS splits Open and Complete next to the admin menu, drops the description card, and adds a Profile button beside Reprint.",
      "Menu & Shop Details save is Save all. Shop name stays in the title bar, not in shop details.",
      "Category tabs stick under the header as a solid bar while you scroll.",
      "Customer order history groups by date in expandable trays.",
      "Admin accounts no longer see Order and Help in the title bar.",
    ],
  },
  {
    id: "2026-09-08-desk-polish",
    date: "September 8, 2026",
    title: "POS chat pings, full backdrop, seasonal effects",
    added: [
      "Admin chat no longer shows canned reply chips.",
      "If a guest chats about a live ticket, that row on POS lights up with a message notice.",
      "Customer chat only lists active tickets in About this order — completed and canceled stay off the list.",
      "Admin drawer now says Menu & Shop Details. Short name is gone; one save writes prices and shop details together.",
      "Shop backdrop fills the whole screen, faded so the menu stays readable.",
      "Background tab can turn on quiet holiday effects: New Year's, Christmas, Halloween, 4th of July, Valentine's, and St. Patrick's.",
    ],
  },
  {
    id: "2026-09-08-customer-center",
    date: "September 8, 2026",
    title: "Customer center, cash, and chat tools",
    added: [
      "Delivery checkout says Cash instead of pay the driver.",
      "Messages, orders, and the customer book live in one Customer center.",
      "Admin chat can flag, mute the pip, ban, delete a line or the whole thread, and keep a staff note.",
      "Quick replies, timestamps, and Enter-to-send on shop chats.",
      "Old Messages, Orders, and Customers links open the same hub.",
      "When the shop marks a chat complete, the customer window goes blank instead of jumping back to an older thread. Start a new chat stays on a fresh conversation.",
    ],
  },
  {
    id: "2026-09-08-checkout-ops",
    date: "September 8, 2026",
    title: "Checkout, scheduled orders, and the kitchen queue",
    added: [
      "Remove items from the bag on checkout, or step the quantity down.",
      "Category skip buttons move one section at a time, with a clear background.",
      "Customer service order picker shows the date and time the ticket was placed.",
      "Reset password emails a 60-second one-time code before a new password can be set.",
      "Schedule pickup or delivery for a later date during checkout.",
      "Call and Chat stay pinned in the bottom-right corner on the storefront.",
      "Today, this week, and tips moved into a rebuilt Financials page.",
      "POS ticket search is a floating button. Incoming orders pop with an alarm and a queue, and the alarm file is on Background.",
    ],
  },
  {
    id: "2026-09-08-pos-drawer",
    date: "September 8, 2026",
    title: "POS station, drawer, and account password",
    added: [
      "Category rail skip buttons jump two sections left or right.",
      "Admin drawer covers the title bar so Menu stays on top.",
      "Reward points stay on Your account — not the header or storefront.",
      "Customers can set a new password on Your account with the email on file.",
      "Background tab uploads the website icon as well as the faded backdrop.",
      "POS uses Placed, Accepted (yellow), and Completed (green). Add or remove lines, search the menu, and reprint. The title bar hides in POS.",
      "Admin drawer starts with Main menu and ends with Log out.",
    ],
  },
  {
    id: "2026-09-08-admin",
    date: "September 8, 2026",
    title: "Admin drawer, POS in the title bar, custom backdrop",
    added: [
      "POS sits in the title bar for admin accounts, on every shop page.",
      "Customers, financials, and shop settings are their own admin pages — no more nested settings tabs.",
      "Admin categories live in a retractable drawer, closed by default, listed A–Z.",
      "Background page to upload a custom faded shop mark, or restore the buffalo-and-chicken icon.",
    ],
  },
  {
    id: "2026-09-08",
    date: "September 8, 2026",
    title: "Search, recovery, and kitchen notes",
    added: [
      "Backdrop is the buffalo-and-chicken icon, smaller and higher on the screen, with the shop-name engraving removed.",
      "Forgot password on sign-in. Recover with the email or phone on the account plus the phone or name on file.",
      "Reorder from account history, including kitchen notes and cook comments.",
      "Storefront and header stay a readable width on large screens instead of stretching edge to edge.",
      "Search cell before Pizza, with suggestions ranked by name, description, then category.",
      "Pickup orders require a name at confirmation.",
      "Admins can remove a ticket from the system and ban an account.",
      "Marking a chat completed tells the customer it has concluded and starts them on a fresh thread.",
      "Cook comments under each item, printed large on the store copy under that line.",
      "Half-and-half split-this-pie toggle taken off the pizza builder.",
    ],
  },
  {
    id: "2026-09-07",
    date: "September 7, 2026",
    title: "Pizza builder, extra large, and shop notices",
    added: [
      "Customize popup on every pizza — extra toppings, half-and-half, and a live price.",
      "Topping charges follow pizza size (small through extra large). Half toppings are half price.",
      "Admin toggle to offer extra large pies, with a price field you set yourself (added on top of large).",
      "Admin message pip moved to the Admin tab. Opening a thread marks it read and drops the count.",
      "This Patches tab, listing what landed in the shop.",
      "Stationary faded buffalo-and-chicken backdrop with the white studio background removed.",
    ],
  },
  {
    id: "2026-09-06",
    date: "September 6, 2026",
    title: "Store flow, tips, and customer book",
    added: [
      "Pay first, kitchen accepts on the tablet, then the receipt prints.",
      "Sign-in with email, Google, or X. Phone maps to a shop account. App TOTP for 2FA.",
      "Tips at 10%, 15%, 20%, or a custom amount. New Jersey tips stay off the sales-tax line.",
      "Customer notes print in a NOTES block under the receipt header.",
      "Customer database in Settings, with order history and the option to grant admin.",
      "Help chat for customers, plus a call-the-shop line. POS lists tickets in time order.",
    ],
  },
  {
    id: "2026-09-05",
    date: "September 5, 2026",
    title: "Shop desk and wall menu",
    added: [
      "Live storefront for pickup and painted delivery zones.",
      "Admin menu editor and printable wall menu.",
      "Settings for tax, hours, delivery, website copy, financials, and rewards.",
      "Bluetooth printer setup with customer and store copies.",
      "Payment processor panel (under construction).",
    ],
  },
];
