import gretzkyCard from "@/assets/gretzky-card.jpg";
import mcdavidCard from "@/assets/mcdavid-card.jpg";
import jersey from "@/assets/jersey.jpg";
import puck from "@/assets/puck.jpg";
import ticket from "@/assets/ticket.jpg";
import stick from "@/assets/stick.jpg";

export interface CollectionItem {
  id: string;
  collectionId: string;
  name: string;
  player: string;
  team: string;
  sport: string;
  year: string;
  category: string;
  subCategory: string;
  condition: string;
  grade: string;
  gradingCompany: string;
  certificationNumber: string;
  authenticationCompany: string;
  purchasePrice: number;
  estimatedValue: number;
  recentSalePrice: number;
  storageLocation: string;
  notes: string;
  dateAcquired: string;
  images: string[];
  createdDate: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  createdDate: string;
}

export const collections: Collection[] = [
  { id: "1", name: "Hockey Roster", description: "Premium hockey cards and memorabilia", createdDate: "2023-01-15" },
  { id: "2", name: "Autograph Roster", description: "Signed sports memorabilia", createdDate: "2023-03-20" },
];

export const items: CollectionItem[] = [
  {
    id: "1", collectionId: "1", name: "Wayne Gretzky Rookie Card", player: "Wayne Gretzky", team: "Edmonton Oilers",
    sport: "Hockey", year: "1979", category: "Cards", subCategory: "Rookie Card", condition: "Near Mint",
    grade: "7", gradingCompany: "PSA", certificationNumber: "45829231", authenticationCompany: "PSA",
    purchasePrice: 8500, estimatedValue: 12000, recentSalePrice: 11500, storageLocation: "Safe Deposit Box A",
    notes: "Key piece of the collection. OPC #18.", dateAcquired: "2021-06-15", images: [gretzkyCard], createdDate: "2021-06-15",
  },
  {
    id: "2", collectionId: "1", name: "Connor McDavid Young Guns", player: "Connor McDavid", team: "Edmonton Oilers",
    sport: "Hockey", year: "2015", category: "Cards", subCategory: "Rookie Card", condition: "Gem Mint",
    grade: "10", gradingCompany: "PSA", certificationNumber: "52938471", authenticationCompany: "PSA",
    purchasePrice: 1800, estimatedValue: 2450, recentSalePrice: 2300, storageLocation: "Binder 3",
    notes: "Upper Deck Series 1 #201.", dateAcquired: "2022-01-10", images: [mcdavidCard], createdDate: "2022-01-10",
  },
  {
    id: "3", collectionId: "2", name: "Signed Game-Worn Jersey", player: "Sidney Crosby", team: "Pittsburgh Penguins",
    sport: "Hockey", year: "2019", category: "Memorabilia", subCategory: "Jersey", condition: "Excellent",
    grade: "", gradingCompany: "", certificationNumber: "JSA-29481", authenticationCompany: "JSA",
    purchasePrice: 3200, estimatedValue: 4500, recentSalePrice: 4200, storageLocation: "Display Case",
    notes: "Game worn during 2019 playoffs.", dateAcquired: "2020-03-22", images: [jersey], createdDate: "2020-03-22",
  },
  {
    id: "4", collectionId: "2", name: "Autographed Puck", player: "Mario Lemieux", team: "Pittsburgh Penguins",
    sport: "Hockey", year: "1995", category: "Memorabilia", subCategory: "Puck", condition: "Excellent",
    grade: "", gradingCompany: "", certificationNumber: "BAS-38291", authenticationCompany: "Beckett",
    purchasePrice: 450, estimatedValue: 650, recentSalePrice: 600, storageLocation: "Display Cabinet",
    notes: "Signed at charity event.", dateAcquired: "2019-11-08", images: [puck], createdDate: "2019-11-08",
  },
  {
    id: "5", collectionId: "1", name: "1967 Stanley Cup Finals Ticket", player: "", team: "Toronto Maple Leafs",
    sport: "Hockey", year: "1967", category: "Memorabilia", subCategory: "Ticket", condition: "Good",
    grade: "3", gradingCompany: "PSA", certificationNumber: "81927364", authenticationCompany: "PSA",
    purchasePrice: 1200, estimatedValue: 1800, recentSalePrice: 1650, storageLocation: "Safe Deposit Box A",
    notes: "Last Cup win for the Leafs.", dateAcquired: "2022-08-05", images: [ticket], createdDate: "2022-08-05",
  },
  {
    id: "6", collectionId: "2", name: "Signed Hockey Stick", player: "Bobby Orr", team: "Boston Bruins",
    sport: "Hockey", year: "1972", category: "Memorabilia", subCategory: "Stick", condition: "Good",
    grade: "", gradingCompany: "", certificationNumber: "JSA-19283", authenticationCompany: "JSA",
    purchasePrice: 2800, estimatedValue: 3950, recentSalePrice: 3700, storageLocation: "Display Case",
    notes: "Victoriaville stick with full signature.", dateAcquired: "2021-02-14", images: [stick], createdDate: "2021-02-14",
  },
];

export const portfolioHistory = [
  { month: "Jan", value: 18500 },
  { month: "Feb", value: 19200 },
  { month: "Mar", value: 19800 },
  { month: "Apr", value: 20100 },
  { month: "May", value: 19900 },
  { month: "Jun", value: 21000 },
  { month: "Jul", value: 21800 },
  { month: "Aug", value: 22500 },
  { month: "Sep", value: 23100 },
  { month: "Oct", value: 23800 },
  { month: "Nov", value: 24900 },
  { month: "Dec", value: 25350 },
];

export const categoryBreakdown = [
  { name: "Cards", value: 16250, fill: "hsl(145 72% 40%)" },
  { name: "Jerseys", value: 4500, fill: "hsl(200 70% 50%)" },
  { name: "Pucks", value: 650, fill: "hsl(38 92% 50%)" },
  { name: "Tickets", value: 1800, fill: "hsl(280 65% 60%)" },
  { name: "Sticks", value: 3950, fill: "hsl(340 75% 55%)" },
];

export function getTotalValue(): number {
  return items.reduce((sum, item) => sum + item.estimatedValue, 0);
}

export function getTotalCost(): number {
  return items.reduce((sum, item) => sum + item.purchasePrice, 0);
}

export function getTotalGain(): number {
  return getTotalValue() - getTotalCost();
}

export function getTopAsset(): CollectionItem {
  return items.reduce((max, item) => item.estimatedValue > max.estimatedValue ? item : max, items[0]);
}
