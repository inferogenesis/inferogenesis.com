export interface NavItem {
  label: string;
  href: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const nav: NavGroup[] = [
  {
    label: 'Projects',
    items: [
      { label: 'cpomdp', href: '/projects/cpomdp/' },
      { label: 'warrantlib', href: '/projects/warrantlib/' },
    ],
  },
  {
    label: 'Programmes',
    items: [
      { label: 'p*', href: '/programmes/p-star/' },
      { label: 'SN', href: '/programmes/sn/' },
    ],
  },
];
