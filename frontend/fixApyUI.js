const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'VaultTab.tsx');
let c = fs.readFileSync(filePath, 'utf-8');

c = c.replace(
  '<span className="text-[14px] font-bold text-[#10B981]">1.20%</span>', 
  '<span className="text-[14px] font-bold text-[#10B981]">{calculateAPY(activeToken, 7)}</span>'
);

c = c.replace(
  '<span className="text-[14px] font-bold text-[#10B981]">3.30%</span>', 
  '<span className="text-[14px] font-bold text-[#10B981]">{calculateAPY(activeToken, 30)}</span>'
);

c = c.replace(
  '<span className="text-[14px] font-bold text-[#10B981]">5.40%</span>', 
  '<span className="text-[14px] font-bold text-[#10B981]">{calculateAPY(activeToken, 60)}</span>'
);

c = c.replace(
  '<span className="text-[14px] font-bold text-slate-400 dark:text-white/40">--</span>', 
  `<span className={\`text-[14px] font-bold \${![7, 30, 60].includes(displayLockDays) ? 'text-[#10B981]' : 'text-slate-400 dark:text-white/40'}\`}>\n                  {![7, 30, 60].includes(displayLockDays) ? calculateAPY(activeToken, displayLockDays) : '--'}\n                </span>`
);

fs.writeFileSync(filePath, c, 'utf-8');
console.log('Fixed APY successfully.');
