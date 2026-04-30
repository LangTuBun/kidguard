import { fetchThingPropertiesRaw, pickLatLngFromPropertiesPayload } from './arduinoCloud.js'

async function run() {
  const ids = ['cb184099-9a5c-4a47-a5cc-d712bff00f7a','ec93886c-58ff-4d6a-863e-0ced0d159a77']
  const clients = ['PQjMOh0ootAoe9Fk6cbPrYIYh42EKe7H', '7T5WTCe0d2HgyZusaKPCzic7WyoOh76B']
  const secrets = ['S5JN6YDIuQWxPteLCCNTH4uk88QVO23WIX0mzdEhiRqXcG2UKQazbyqHjkzEXagb', 'hyWbzCJHpyXs84IYZbeoVDrShIigBTO7Y4jTZ9LOUtylikiAGheU8gpELqOkxsDI']

  for (let i = 0; i < 2; i++) {
    const raw = await fetchThingPropertiesRaw(ids[i], clients[i], secrets[i]);
    console.log(`\n--- Thing ${i} (${ids[i]}) ---`);
    const prop = raw.find(p => (p.name || p.variable_name || '').toLowerCase() === 'gps');
    if (prop) {
      console.log('Raw Gps property last_value:', JSON.stringify(prop.last_value, null, 2));
      console.log('Raw Gps property value:', JSON.stringify(prop.value, null, 2));
      console.log('Raw Gps updated_at:', prop.updated_at);
      console.log('Raw Gps value_updated_at:', prop.value_updated_at);
    } else {
      console.log('No Gps property found in raw data.');
    }
    
    const picked = pickLatLngFromPropertiesPayload(raw);
    console.log('Picked Lat Lng:', picked);
  }
}
run().catch(console.error);
