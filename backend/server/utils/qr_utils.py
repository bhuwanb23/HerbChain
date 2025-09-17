import base64
import io
from typing import Union

import qrcode


def generate_qr_base64(data: Union[str, bytes]) -> str:
    """Generate a QR code PNG image and return as data URL base64 string.

    Args:
        data: The content to encode in the QR code.

    Returns:
        A string formatted as a data URL: 'data:image/png;base64,<...>'.
    """
    if isinstance(data, bytes):
        payload = data
    else:
        payload = data.encode("utf-8")

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(payload)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    base64_bytes = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{base64_bytes}"


