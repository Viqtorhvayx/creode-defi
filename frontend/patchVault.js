const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'VaultTab.tsx');
let c = fs.readFileSync(filePath, 'utf-8');

// Fix 1: Find the broken summary+button block and replace it entirely
const brokenPattern = `          {/* Summary Row */}\n          <div className="flex flex-col gap-3 w-full mb-6 pt-2">\n            `;
const buttonIdx = c.indexOf('onClick={handleDeposit}');
const summaryIdx = c.indexOf('{/* Summary Row */}');

if (summaryIdx !== -1 && buttonIdx !== -1) {
  // Find the start of summary section
  const summaryStart = c.lastIndexOf('\n', summaryIdx) + 1;
  // Find the end of the deposit button closing tag
  const closeBtnEnd = c.indexOf('</button>', buttonIdx) + '</button>'.length;
  
  const correctedSummaryAndButton = `          {/* Summary Row */}
          <div className="flex flex-col gap-3 w-full mb-6 pt-2">
            <div className="flex justify-between items-center w-full">
              <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50">Lock Period</span>
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">{displayLockDays} Days</span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50">Maturity Date</span>
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">{formattedMaturityDate}</span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50">Estimated Earnings</span>
              <span className="text-[13px] font-bold text-[#10B981]">+4.50 {activeToken}</span>
            </div>
          </div>

          {/* Deposit / Withdraw Buttons */}
          <div className="mt-auto pt-4 w-full">
            <button 
              onClick={handleDeposit}
              disabled={isProcessing || isSuccess}
              className={\`w-full h-12 rounded-[8px] text-[15px] font-bold flex items-center justify-center transition-all duration-100 ease-in active:scale-[0.98] tracking-wide shadow-sm relative \${
                isSuccess 
                  ? 'bg-emerald-500 text-white pointer-events-none' 
                  : isProcessing 
                    ? 'bg-[#00A8E8]/80 text-white cursor-not-allowed' 
                    : 'bg-[#00A8E8] hover:bg-[#0090C7] hover:brightness-105 hover:shadow-md text-white'
              }\`}
            >
              {isSuccess && (
                <div className="absolute inset-0 rounded-[8px] bg-emerald-500 animate-ping-once pointer-events-none"></div>
              )}
              
              {isProcessing ? (
                <div className="flex items-center gap-2 z-10">
                  <CircleNotch size={18} weight="bold" className="animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : isSuccess ? (
                <div className="flex items-center gap-2 z-10">
                  <CheckCircle size={18} weight="bold" />
                  <span>Deposited Successfully</span>
                </div>
              ) : (
                <span className="z-10">Deposit to Vault</span>
              )}
            </button>`;

  c = c.substring(0, summaryStart) + correctedSummaryAndButton + c.substring(closeBtnEnd);
  
  fs.writeFileSync(filePath, c, 'utf-8');
  console.log('Fixed summary row and deposit button!');
} else {
  console.log('Could not find anchors. summaryIdx:', summaryIdx, 'buttonIdx:', buttonIdx);
}
