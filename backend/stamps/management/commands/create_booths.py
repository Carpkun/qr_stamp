from django.core.management.base import BaseCommand
from stamps.models import Booth


class Command(BaseCommand):
    help = '소양강문화제 체험부스 초기 데이터를 생성합니다'

    def handle(self, *args, **options):
        # 소양강문화제 체험부스 데이터 (예시)
        booths_data = [
            {"code": "BOOTH001", "name": "전통 한지공예 체험", "description": "한지를 이용한 전통 공예품 만들기 체험"},
            {"code": "BOOTH002", "name": "도자기 물레 체험", "description": "전통 도자기 제작 과정 체험"},
            {"code": "BOOTH003", "name": "천연염색 체험", "description": "천연 재료를 이용한 염색 체험"},
            {"code": "BOOTH004", "name": "전통 음식 만들기", "description": "춘천 지역 전통 음식 만들기 체험"},
            {"code": "BOOTH005", "name": "민화 그리기 체험", "description": "전통 민화 그리기 체험"},
            {"code": "BOOTH006", "name": "서예 체험", "description": "붓글씨와 서예 체험"},
            {"code": "BOOTH007", "name": "전통 놀이 체험", "description": "윷놀이, 제기차기 등 전통 놀이 체험"},
            {"code": "BOOTH008", "name": "소양강 사진전", "description": "소양강의 사계절 사진 전시 및 포토존"},
            {"code": "BOOTH009", "name": "춘천 역사 체험관", "description": "춘천의 역사와 문화 체험"},
            {"code": "BOOTH010", "name": "전통악기 체험", "description": "가야금, 장구 등 전통악기 체험"},
            {"code": "BOOTH011", "name": "목공예 체험", "description": "나무를 이용한 소품 만들기"},
            {"code": "BOOTH012", "name": "전통차 체험", "description": "전통차 시음 및 차 문화 체험"},
            {"code": "BOOTH013", "name": "자연물 공예", "description": "솔방울, 나뭇가지 등을 이용한 공예"},
            {"code": "BOOTH014", "name": "전통 의상 체험", "description": "한복 착용 및 사진 촬영 체험"},
            {"code": "BOOTH015", "name": "춘천닭갈비 만들기", "description": "춘천 명물 닭갈비 만들기 체험"},
            {"code": "BOOTH016", "name": "소양강 생태 체험", "description": "소양강 생태계와 환경 보호 체험"},
        ]

        created_count = 0
        updated_count = 0

        for booth_data in booths_data:
            booth, created = Booth.objects.get_or_create(
                code=booth_data['code'],
                defaults={
                    'name': booth_data['name'],
                    'description': booth_data['description'],
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ 새로운 부스 생성: {booth.code} - {booth.name}')
                )
            else:
                # 기존 부스 정보 업데이트
                booth.name = booth_data['name']
                booth.description = booth_data['description']
                booth.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'🔄 기존 부스 업데이트: {booth.code} - {booth.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n🎉 부스 데이터 처리 완료!\n'
                f'   - 새로 생성된 부스: {created_count}개\n'
                f'   - 업데이트된 부스: {updated_count}개\n'
                f'   - 총 부스 수: {Booth.objects.count()}개'
            )
        )
