def round_complex(c, ndigits):
    real = round(c.real, ndigits)
    imag = round(c.imag, ndigits)
    return complex(real, imag)
