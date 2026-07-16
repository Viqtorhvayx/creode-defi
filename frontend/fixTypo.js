const fs = require('fs');
let content = fs.readFileSync('src/components/VaultTab.tsx', 'utf-8');
content = content.replace(
  '<span className="text-[12px] font-medium text-slate-500 dark:text-white/50">\r\n                <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">\r\n                  ,250.00</span>',
  '<span className="text-[12px] font-medium text-slate-500 dark:text-white/50">$1,250.00</span>'
);
content = content.replace(
  '<span className="text-[12px] font-medium text-slate-500 dark:text-white/50">\n                <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">\n                  ,250.00</span>',
  '<span className="text-[12px] font-medium text-slate-500 dark:text-white/50">$1,250.00</span>'
);
fs.writeFileSync('src/components/VaultTab.tsx', content);
