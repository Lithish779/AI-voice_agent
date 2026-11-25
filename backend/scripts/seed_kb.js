import mongoose from 'mongoose';
import { ingest } from '../src/rag.js';
import { Chunk } from '../src/models.js';

try { process.loadEnvFile(); } catch {}
try { process.loadEnvFile('../.env'); } catch {}

const documents = [
  {
    source: 'residential_packages',
    text: 'Acme Solar Residential Packages: We offer three core home solar packages. The Starter Package features a 5kW Tier-1 monocrystalline rooftop solar array suitable for 2-3 bedroom homes, saving up to 60% on electric bills. The Family Pro Package offers a 10kW array paired with an integrated smart inverter, ideal for 3-5 bedroom homes. The Maximum Independence Package provides a 15kW array complete with full energy management. All systems include lifetime mobile app monitoring and seamless grid net metering connection.'
  },
  {
    source: 'battery_storage',
    text: 'Battery Storage & Tesla Powerwall Integration: Acme Solar installs Tesla Powerwall 3 and Enphase IQ Battery 5P energy storage units. A single battery provides 13.5 kWh of usable capacity and 11.5 kW of continuous power output during utility power outages. When the electrical grid goes down, our automatic transfer switch islanding engages within 50 milliseconds to keep critical home appliances, medical equipment, refrigerators, and lighting fully powered with zero interruption.'
  },
  {
    source: 'warranty_and_durability',
    text: 'Warranty, Longevity & Panel Durability: All Acme Solar panels come with a 25-year comprehensive manufacturer and linear power production warranty guaranteeing at least 88% power output at year 25. We also provide a 10-year workmanship warranty covering all roof penetrations and weatherproofing against leaks. Inverters carry a 12-to-25 year warranty. The solar panels are certified to withstand 140 mph hurricane-force winds and 1-inch hail impact at 52 mph.'
  },
  {
    source: 'federal_tax_credits_and_incentives',
    text: 'Federal Tax Credits, Solar Rebates & SRECs: Homeowners purchasing an Acme Solar system qualify for the 30% Federal Residential Clean Energy Property Credit (Section 25D) on both solar panels and battery storage. This directly reduces your federal tax liability dollar-for-dollar. In addition, net metering credits your electric utility bill for excess surplus energy sent back to the grid, and local state Solar Renewable Energy Certificates (SRECs) provide ongoing cash returns.'
  },
  {
    source: 'installation_timeline_and_process',
    text: 'Solar Installation Process & Timeline: The complete process from consultation to activation takes 3 to 6 weeks. Step 1: Free virtual or on-site 3D engineering roof assessment and proposal. Step 2: HOA and municipal permitting documentation prepared by our team. Step 3: Physical roof installation completed in just 1 to 2 days by certified NABCEP master electricians. Step 4: City building inspection and utility Permission to Operate (PTO) meter swap.'
  },
  {
    source: 'roof_compatibility_and_shading',
    text: 'Roof Compatibility, Structural Integrity & Shading: Acme Solar installs on asphalt shingle, standing seam metal, tile, and flat membrane roofs using flashing and non-penetrating clamping systems. We perform structural load analysis to verify roof rafter capacity. For homes with partial tree shading or complex roof orientations, we install Enphase microinverters or SolarEdge DC power optimizers on each panel so shade on one panel never diminishes the performance of the rest of the array.'
  },
  {
    source: 'financing_and_payment_options',
    text: 'Financing, Zero-Down Loans & Solar Leases: Acme Solar offers flexible financing options starting at $0 down. Options include: 1) Cash Purchase with maximum ROI payback in 5-7 years; 2) Low-interest Solar Loans from 10 to 25 years with payments typically lower than your current monthly electric bill; 3) Solar Lease / PPA (Power Purchase Agreement) where you pay a fixed, low rate per kilowatt-hour produced with zero maintenance liability.'
  },
  {
    source: 'maintenance_and_cleaning',
    text: 'Maintenance, Cleaning & 24/7 Remote Monitoring: Solar photovoltaic panels have no moving parts and require minimal maintenance. Natural rain clears most surface dust and debris. We recommend an annual visual inspection and light rinsing during dry summers. Every Acme Solar system is connected to our automated cloud telemetry center which monitors kilowatt output 24/7/365 and instantly alerts our service dispatch team if an inverter error or panel degradation occurs.'
  },
  {
    source: 'commercial_solar_solutions',
    text: 'Commercial Solar & Business Fleet Charging: Acme Commercial Solar designs custom 25kW to 500kW+ systems for warehouses, retail centers, schools, and agricultural facilities. Commercial solar enables accelerated depreciation deductions via MACRS (Modified Accelerated Cost Recovery System) alongside the 30% Investment Tax Credit (ITC). We also engineer commercial solar carports with integrated Level 2 and DC Fast EV charging stations for company fleets and employee vehicles.'
  },
  {
    source: 'ev_chargers_and_smart_home',
    text: 'Electric Vehicle (EV) Chargers & Smart Energy Management: Acme Solar integrates Level 2 home EV chargers (such as Tesla Universal Wall Connector, ChargePoint Home Flex, and Emporia EVSE) delivering up to 48 amps (11.5 kW) for charging up to 44 miles of range per hour. Our smart home energy gateway lets you configure Solar-Only EV Charging to fuel your electric vehicle entirely on 100% free sunshine generated from your roof.'
  }
];

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/voiceagent');
  console.log('Connected!');

  for (const doc of documents) {
    // Delete existing chunks for this source if already present to avoid duplication
    await Chunk.deleteMany({ source: doc.source });
    console.log(`Ingesting document: "${doc.source}"...`);
    const count = await ingest(doc.source, doc.text);
    console.log(`✓ Ingested "${doc.source}" (${count} chunk(s))`);
  }

  const allChunks = await Chunk.countDocuments();
  console.log(`\n🎉 Ingestion complete! Total chunks in database: ${allChunks}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
