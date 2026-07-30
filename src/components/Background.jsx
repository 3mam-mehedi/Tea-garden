export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#ffffff]" aria-hidden="true">
      {/* Rich warm tea leaf green gradient blob */}
      <div className="absolute top-0 left-0 h-[70vh] w-[70vh] rounded-full bg-gradient-to-br from-[#2C5E3B]/30 via-[#3A7A4A]/30 to-transparent blur-[90px] pointer-events-none" />

      {/* Warm natural tea/coffee golden-brown amber accent blob */}
      <div className="absolute bottom-0 right-0 h-[70vh] w-[70vh] rounded-full bg-gradient-to-tl from-[#215b38]/25 via-[#215b38]/35 to-transparent blur-[90px] pointer-events-none" />

      {/* Clear distinct grid pattern so the background is immediately visible */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2C5E3B1F_1px,transparent_1px),linear-gradient(to_bottom,#2C5E3B1F_1px,transparent_1px)] bg-[size:3rem_3rem]" />
    </div>
  );
}