export function assignRandomMac() {
    const mac = crypto.getRandomValues(new Uint8Array(6));
    // Unicast, locally administered.
    mac[0] = mac[0] & ~0b00000001 | 0b00000010;
    return  Array.from(mac, v => v.toString(16).padStart(2, "0")).join(":");
}
