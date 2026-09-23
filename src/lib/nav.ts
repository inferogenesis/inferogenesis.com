export interface NavItem {
  label: string;
  href: string;
}

// A section joins the navigation in the PR that ships its first page. The link check
// fails the build on any link to a page that does not exist.
export const primaryNav: NavItem[] = [{ label: 'Projects', href: '/projects/' }];

export const footerNav: NavItem[] = [
  { label: 'About', href: '/about/' },
  { label: 'Support', href: '/support/' },
  { label: 'GitHub', href: 'https://github.com/inferogenesis' },
];
