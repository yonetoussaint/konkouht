import { useState, useRef, useEffect } from "react";
import { 
  Music, PersonStanding, Trophy, Palette, Laugh, Gamepad2, 
  LayoutGrid, Home, Wallet, User, Bell, BadgeCheck, Play, 
  File, Plus, Gift, ArrowDownLeft, ArrowUpRight, ShoppingCart, X 
} from "lucide-react";

// Add these type definitions
interface Competition {
  id: string;
  title: string;
  edition: string;
  contestants: number;
  votes: number;
  ends: string;
  organisateur: string;
  hot: boolean;
  followers: number;
  mediaType: string;
}

interface Niche {
  id: string;
  label: string;
  accent: string;
  icon: string;
  competitions: Competition[];
}

interface Gift {
  id: string;
  name: string;
  icon: string;
  cost: number;
}

interface Transaction {
  id: string;
  type: string;
  label: string;
  amount: number;
  date: string;
}

// Then paste the rest of your component code below
// ... (your existing component code)