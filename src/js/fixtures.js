/**
 * Built-in CSV Fixtures for demonstration and automated testing.
 */

export const FIXTURE_FREELANCE_Q3_CSV = `Date,Description,Category,Amount,Type
2026-10-18,Client Retainer Alpha,Contracts,2500.00,income
2026-10-14,Studio Rent,Housing,1850.00,expense
2026-10-12,Milestone Beta,Engineering,1250.00,income
2026-10-08,Taxes & Reserve Fund,Taxes & Reserves,1100.00,expense
2026-10-05,Health Insurance,Healthcare,620.00,expense
2026-10-03,Advisory Consultation,Advisory,500.00,income
2026-10-02,Cloud Infrastructure,Infrastructure,450.00,expense
2026-10-16,Equipment & Tools,Equipment,700.00,expense
2026-10-20,Essentials & Food,Food & Living,400.00,expense`;

export const FIXTURE_SURPLUS_Q4_CSV = `Date,Description,Category,Amount,Type
2026-10-02,Enterprise Advisory Retainer,Contracts,4000.00,income
2026-10-10,Security Architecture Sprint,Engineering,2500.00,income
2026-10-05,Studio Space,Housing,1800.00,expense
2026-10-12,Health Insurance,Healthcare,620.00,expense
2026-10-15,Tax Reserve,Taxes & Reserves,1200.00,expense
2026-10-18,Cloud Infrastructure,Infrastructure,480.00,expense
2026-10-22,Essentials,Food & Living,400.00,expense`;

export const FIXTURE_BALANCED_CSV = `Date,Description,Category,Amount,Type
2026-10-05,Fixed Contract Inflow,Contracts,5000.00,income
2026-10-02,Office Lease,Housing,2500.00,expense
2026-10-10,Team Operations,Engineering,1500.00,expense
2026-10-15,Hosting & Tooling,Infrastructure,1000.00,expense`;

export const FIXTURE_QUOTED_BOM_CRLF_CSV =
  '\uFEFFDate,Description,Category,Amount,Type\r\n' +
  '2026-10-18,"Client Retainer, Alpha\r\n(Phase 2 Milestone)",Contracts,$2,500.00,income\r\n' +
  '2026-10-14,"Studio Lease, Floor 4\r\n(Includes Utilities)",Housing,$1,850.00,expense\r\n' +
  '2026-10-12,"Beta Milestone, Verified",Engineering,$1,250.00,income\r\n' +
  '2026-10-08,"Taxes, Q3 Reserve",Taxes & Reserves,$1,100.00,expense\r\n' +
  '2026-10-05,"Comprehensive Health, Dental & Vision",Healthcare,$620.00,expense\r\n' +
  '2026-10-03,"Hourly Advisory, Strategic",Advisory,$500.00,income\r\n' +
  '2026-10-02,"Cloud Infrastructure, GPU Nodes",Infrastructure,$450.00,expense\r\n';
