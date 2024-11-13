class addLine:

    def __init__(self, vectorsLines, outfile):
        self.vectorsLines = vectorsLines
        self.outfile = outfile
        self.__search()
            
            
    def __search(self):
        lines = self.vectorsLines
        for i in range(len(lines)):
            x1, y1, z1 = lines[i].strip().split()
            x1 = int(float(x1))
            y1 = int(float(y1))
            z1 = int(float(z1))
            proche = []
            for j in range(len(lines)):
                if i == j:
                    continue  # Skip comparing the same line
                x2, y2, z2 = lines[j].strip().split()
                x2 = int(float(x2))
                y2 = int(float(y2))
                z2 = int(float(z2))
                if distUn(x1, y1, z1, x2, y2, z2): 
                    self.outfile.write(f'l {i+1} {j+1}\n')

def distUn(x1, y1, z1, x2, y2, z2):
    return (abs(x1 - x2) <= 1) and (abs(y1 - y2) <= 1) and (abs(z1 - z2) <= 1)